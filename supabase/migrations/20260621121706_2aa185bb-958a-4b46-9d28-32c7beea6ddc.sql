
-- Enable fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy fallback
CREATE INDEX IF NOT EXISTS articles_title_trgm_idx ON public.articles USING gin (lower(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS articles_subtitle_trgm_idx ON public.articles USING gin (lower(coalesce(subtitle,'')) gin_trgm_ops);

-- Private search logs (no public access; service_role only)
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  normalized_query text,
  result_count integer NOT NULL DEFAULT 0,
  used_semantic boolean NOT NULL DEFAULT false,
  top_result_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.search_logs TO service_role;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies: blocks anon and authenticated entirely. Service role bypasses RLS for logging.

CREATE INDEX IF NOT EXISTS search_logs_created_at_idx ON public.search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS search_logs_normalized_query_idx ON public.search_logs (normalized_query);

-- Improved search_articles: topic boost + recency boost + phrase support + trigram fallback
CREATE OR REPLACE FUNCTION public.search_articles(search_query text, max_results integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, subtitle text, content text, url text, published_date date, topics text[], images text[], rank real)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  strict_count integer;
  ts_q tsquery;
  q_lower text;
  q_clean text;
BEGIN
  q_lower := lower(trim(search_query));
  -- Quoted phrase → phrase query; else websearch
  IF q_lower LIKE '"%"' AND length(q_lower) > 2 THEN
    q_clean := trim(both '"' from search_query);
    BEGIN
      ts_q := phraseto_tsquery('english', q_clean);
    EXCEPTION WHEN OTHERS THEN
      ts_q := websearch_to_tsquery('english', search_query);
    END;
  ELSE
    ts_q := websearch_to_tsquery('english', search_query);
  END IF;

  RETURN QUERY
    SELECT a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
      (
        ts_rank_cd(a.fts, ts_q)
        -- Strong boost when query matches a curated topic exactly
        + CASE WHEN EXISTS (
            SELECT 1 FROM unnest(a.topics) t
            WHERE lower(t) = q_lower OR lower(t) LIKE '%' || q_lower || '%'
          ) THEN 0.4 ELSE 0 END
        -- Recency boost: up to +0.15 for fresh, decaying over ~3 years
        + CASE WHEN a.published_date IS NOT NULL
               THEN GREATEST(0.0, 0.15 - (EXTRACT(EPOCH FROM (now() - a.published_date::timestamp)) / (60.0*60*24*365)) * 0.05)
               ELSE 0 END
      )::real AS rank
    FROM public.articles a
    WHERE a.fts @@ ts_q
    ORDER BY rank DESC
    LIMIT max_results;

  GET DIAGNOSTICS strict_count = ROW_COUNT;

  IF strict_count = 0 THEN
    -- Trigram fuzzy fallback for typos / partial matches
    RETURN QUERY
      SELECT a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
        GREATEST(
          similarity(lower(a.title), q_lower),
          similarity(lower(coalesce(a.subtitle, '')), q_lower),
          similarity(lower(array_to_string(a.topics, ' ')), q_lower)
        )::real AS rank
      FROM public.articles a
      WHERE
        lower(a.title) % q_lower
        OR lower(coalesce(a.subtitle, '')) % q_lower
        OR lower(array_to_string(a.topics, ' ')) % q_lower
      ORDER BY rank DESC
      LIMIT max_results;
  END IF;
END;
$function$;
