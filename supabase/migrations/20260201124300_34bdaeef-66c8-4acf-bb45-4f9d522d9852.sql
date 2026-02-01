-- Add images column to store image URLs from articles
ALTER TABLE public.articles ADD COLUMN images TEXT[] DEFAULT '{}';