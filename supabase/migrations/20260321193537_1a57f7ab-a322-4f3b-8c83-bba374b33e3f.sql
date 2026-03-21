
CREATE POLICY "Articles are publicly editable" ON public.articles FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Articles are publicly deletable" ON public.articles FOR DELETE TO public USING (true);
