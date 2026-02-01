-- Add topics column to store H4 headings from articles
ALTER TABLE public.articles ADD COLUMN topics TEXT[] DEFAULT '{}';