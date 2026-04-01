BEGIN;

-- Step 1: delete incorrectly named duplicates

-- Delete "Вестник экономического правосудия" issues 1-8 where "Вестник ВАС РФ" duplicate exists
DELETE FROM articles a1
WHERE a1.journal = 'Вестник экономического правосудия'
  AND a1.issue ~ '^\d+$' AND a1.issue::int <= 8
  AND EXISTS (
    SELECT 1 FROM articles a2
    WHERE a2.title = a1.title AND a2.year = a1.year
      AND a2.journal = 'Вестник ВАС РФ'
  );

-- Delete "Вестник ВАС РФ" issues 9+ where "Вестник экономического правосудия" duplicate exists
DELETE FROM articles a1
WHERE a1.journal = 'Вестник ВАС РФ'
  AND a1.issue ~ '^\d+$' AND a1.issue::int > 8
  AND EXISTS (
    SELECT 1 FROM articles a2
    WHERE a2.title = a1.title AND a2.year = a1.year
      AND a2.journal = 'Вестник экономического правосудия'
  );

-- Step 2: rename remaining articles with wrong journal name

UPDATE articles SET journal = 'Вестник ВАС РФ'
WHERE journal = 'Вестник экономического правосудия'
  AND issue ~ '^\d+$' AND issue::int <= 8;

UPDATE articles SET journal = 'Вестник экономического правосудия'
WHERE journal = 'Вестник ВАС РФ'
  AND issue ~ '^\d+$' AND issue::int > 8;

COMMIT;
