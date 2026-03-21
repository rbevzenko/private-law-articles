-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  journal TEXT NOT NULL,
  year INTEGER NOT NULL,
  issue TEXT,
  section TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no write from client)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles are publicly readable"
  ON public.articles FOR SELECT
  USING (true);

-- Index for filtering
CREATE INDEX idx_articles_journal ON public.articles (journal);
CREATE INDEX idx_articles_year ON public.articles (year);
CREATE INDEX idx_articles_topics ON public.articles USING GIN (topics);

-- Unique constraint to avoid duplicates
CREATE UNIQUE INDEX idx_articles_unique ON public.articles (title, journal, year);