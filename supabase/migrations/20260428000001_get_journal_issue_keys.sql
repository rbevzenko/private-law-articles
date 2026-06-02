CREATE OR REPLACE FUNCTION get_journal_issue_keys(journal_name text)
RETURNS TABLE(yr int, iss text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT year, issue
  FROM public.articles
  WHERE journal = journal_name;
$$;
