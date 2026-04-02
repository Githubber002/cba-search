
-- Add tsvector column
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS fts tsvector;

-- Create trigger function to update fts column
CREATE OR REPLACE FUNCTION public.articles_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.topics, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER articles_fts_update
  BEFORE INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.articles_fts_trigger();

-- Backfill existing rows
UPDATE public.articles SET fts =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(topics, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'C');

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_articles_fts ON public.articles USING GIN(fts);

-- Create search function
CREATE OR REPLACE FUNCTION public.search_articles(search_query text, max_results int DEFAULT 10)
RETURNS TABLE(
  id uuid,
  title text,
  subtitle text,
  content text,
  url text,
  published_date date,
  topics text[],
  images text[],
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id, a.title, a.subtitle, a.content, a.url, a.published_date, a.topics, a.images,
    ts_rank_cd(a.fts, websearch_to_tsquery('english', search_query)) as rank
  FROM public.articles a
  WHERE a.fts @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
$$;
