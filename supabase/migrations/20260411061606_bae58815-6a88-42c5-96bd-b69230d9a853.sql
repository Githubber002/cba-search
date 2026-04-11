
CREATE OR REPLACE FUNCTION public.search_articles(search_query text, max_results integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, subtitle text, content text, url text, published_date date, topics text[], images text[], rank real)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  strict_count integer;
  or_query tsquery;
  word text;
  words text[];
BEGIN
  -- First try strict AND matching
  RETURN QUERY
    SELECT a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
           ts_rank_cd(a.fts, websearch_to_tsquery('english', search_query)) as rank
    FROM public.articles a
    WHERE a.fts @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT max_results;
  
  GET DIAGNOSTICS strict_count = ROW_COUNT;
  
  IF strict_count = 0 THEN
    -- Build OR query from individual words
    words := regexp_split_to_array(lower(trim(search_query)), '\s+');
    or_query := NULL;
    FOREACH word IN ARRAY words LOOP
      IF length(word) >= 2 THEN
        BEGIN
          IF or_query IS NULL THEN
            or_query := to_tsquery('english', word || ':*');
          ELSE
            or_query := or_query || to_tsquery('english', word || ':*');
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- skip invalid words
          NULL;
        END;
      END IF;
    END LOOP;
    
    IF or_query IS NOT NULL THEN
      RETURN QUERY
        SELECT a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
               ts_rank_cd(a.fts, or_query) as rank
        FROM public.articles a
        WHERE a.fts @@ or_query
        ORDER BY rank DESC
        LIMIT max_results;
    END IF;
  END IF;
END;
$function$;
