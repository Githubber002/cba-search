
CREATE OR REPLACE FUNCTION public.search_articles(search_query text, max_results integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, subtitle text, content text, url text, published_date date, topics text[], images text[], rank real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Try websearch (AND logic) first, fall back to plainto (OR logic) if no results
  WITH strict_results AS (
    SELECT 
      a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
      ts_rank_cd(a.fts, websearch_to_tsquery('english', search_query)) as rank
    FROM public.articles a
    WHERE a.fts @@ websearch_to_tsquery('english', search_query)
  ),
  loose_results AS (
    SELECT 
      a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
      ts_rank_cd(a.fts, plainto_tsquery('english', search_query)) as rank
    FROM public.articles a
    WHERE a.fts @@ plainto_tsquery('english', search_query)
      AND NOT EXISTS (SELECT 1 FROM strict_results)
  )
  SELECT * FROM strict_results
  UNION ALL
  SELECT * FROM loose_results
  ORDER BY rank DESC
  LIMIT max_results;
$function$;
