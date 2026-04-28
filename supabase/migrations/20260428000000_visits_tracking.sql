CREATE TABLE IF NOT EXISTS public.visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  visited_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON public.visits (visited_at);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits"
  ON public.visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read visits"
  ON public.visits FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION get_visit_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'today',  (SELECT COUNT(DISTINCT session_id) FROM public.visits WHERE visited_at >= CURRENT_DATE),
    'week',   (SELECT COUNT(DISTINCT session_id) FROM public.visits WHERE visited_at >= date_trunc('week',  CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')),
    'month',  (SELECT COUNT(DISTINCT session_id) FROM public.visits WHERE visited_at >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')),
    'year',   (SELECT COUNT(DISTINCT session_id) FROM public.visits WHERE visited_at >= date_trunc('year',  CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow'))
  );
$$;
