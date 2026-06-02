-- Remove page references (e.g. "с. 305", "С. 1-45") from the issue field
-- of collection articles that have no real issue numbers
UPDATE public.articles
SET issue = ''
WHERE issue ~ '^[Сс]\.\s*\d+';
