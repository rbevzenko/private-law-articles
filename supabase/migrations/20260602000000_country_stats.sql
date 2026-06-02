ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country text;

CREATE OR REPLACE FUNCTION get_country_stats()
RETURNS TABLE(country text, cnt bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(country, '??') AS country,
    COUNT(DISTINCT session_id) AS cnt
  FROM public.visits
  GROUP BY country
  ORDER BY cnt DESC
  LIMIT 30;
$$;
