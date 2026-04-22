-- Replace unique constraint to include issue field.
-- Articles in different issues of the same journal (e.g. parts of a serial article)
-- must be treated as distinct records.
DROP INDEX IF EXISTS idx_articles_unique;

CREATE UNIQUE INDEX idx_articles_unique ON public.articles (title, journal, year, COALESCE(issue, ''));
