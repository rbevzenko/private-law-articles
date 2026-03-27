
-- Drop old public policies
DROP POLICY IF EXISTS "Articles are publicly deletable" ON public.articles;
DROP POLICY IF EXISTS "Articles are publicly editable" ON public.articles;
DROP POLICY IF EXISTS "Articles are publicly insertable" ON public.articles;

-- Keep public read
-- "Articles are publicly readable" already exists, keep it

-- Authenticated-only write policies
CREATE POLICY "Authenticated users can insert articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (true);
