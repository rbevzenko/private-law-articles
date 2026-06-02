-- Normalize NULL issues to empty string so a plain unique index
-- on (title, journal, year, issue) works correctly with PostgREST onConflict.
-- NULL values in unique indexes are never considered equal in PostgreSQL,
-- which would silently bypass the duplicate check.

UPDATE articles SET issue = '' WHERE issue IS NULL;

ALTER TABLE articles ALTER COLUMN issue SET DEFAULT '';
ALTER TABLE articles ALTER COLUMN issue SET NOT NULL;

-- Drop the previous functional index (added in migration 20260422000000)
DROP INDEX IF EXISTS idx_articles_unique;

CREATE UNIQUE INDEX idx_articles_unique ON public.articles (title, journal, year, issue);
