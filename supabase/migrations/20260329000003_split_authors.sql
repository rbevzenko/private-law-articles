-- Split comma-separated authors into individual array elements
-- e.g. ['Автор1, Автор2', 'Автор3'] → ['Автор1', 'Автор2', 'Автор3']
UPDATE articles
SET authors = array(
  SELECT TRIM(part)
  FROM unnest(authors) AS elem,
       LATERAL unnest(string_to_array(elem, ',')) AS part
  WHERE TRIM(part) != '' AND TRIM(part) != 'Автор не указан'
)
WHERE EXISTS (
  SELECT 1 FROM unnest(authors) AS a WHERE a LIKE '%,%'
);
