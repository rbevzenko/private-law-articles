-- Create admin emails table to control who can modify articles
CREATE TABLE public.admin_emails (
  email TEXT PRIMARY KEY
);

-- Seed with the known admin (from git history: rbevzenko@gmail.com)
-- Update this if the admin email changes
INSERT INTO public.admin_emails (email) VALUES ('rbevzenko@gmail.com');

-- Protect the admin_emails table itself
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin emails readable by authenticated users"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (true);

-- Replace overly permissive article write policies
-- (previously any authenticated user could modify/delete all articles)

DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.articles;

CREATE POLICY "Admins can insert articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.email() IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can update articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (auth.email() IN (SELECT email FROM public.admin_emails))
  WITH CHECK (auth.email() IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (auth.email() IN (SELECT email FROM public.admin_emails));
