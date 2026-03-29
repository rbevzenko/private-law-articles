-- Normalize author names: merge obvious duplicates

-- Роман Сергеевич Бевзенко
UPDATE articles SET authors = array_replace(authors, 'Роман Бевзенко', 'Роман Сергеевич Бевзенко') WHERE 'Роман Бевзенко' = ANY(authors);
UPDATE articles SET authors = array_replace(authors, 'Р.С. Бевзенко', 'Роман Сергеевич Бевзенко') WHERE 'Р.С. Бевзенко' = ANY(authors);
UPDATE articles SET authors = array_replace(authors, 'Бевзенко Р.С.', 'Роман Сергеевич Бевзенко') WHERE 'Бевзенко Р.С.' = ANY(authors);

-- Ростислав Романович Бевзенко
UPDATE articles SET authors = array_replace(authors, 'Ростислав Бевзенко', 'Ростислав Романович Бевзенко') WHERE 'Ростислав Бевзенко' = ANY(authors);
UPDATE articles SET authors = array_replace(authors, 'Р.Р. Бевзенко', 'Ростислав Романович Бевзенко') WHERE 'Р.Р. Бевзенко' = ANY(authors);

-- Сергачёва О.А. (е → ё)
UPDATE articles SET authors = array_replace(authors, 'Сергачева О.А.', 'Сергачёва О.А.') WHERE 'Сергачева О.А.' = ANY(authors);

-- Артём Карапетов (е → ё)
UPDATE articles SET authors = array_replace(authors, 'Артем Карапетов', 'Артём Карапетов') WHERE 'Артем Карапетов' = ANY(authors);

-- Пепеляев С.Г. (добавить точку)
UPDATE articles SET authors = array_replace(authors, 'Пепеляев С.Г', 'Пепеляев С.Г.') WHERE 'Пепеляев С.Г' = ANY(authors);

-- Решетникова И.В. (добавить точку)
UPDATE articles SET authors = array_replace(authors, 'Решетникова И.В', 'Решетникова И.В.') WHERE 'Решетникова И.В' = ANY(authors);

-- Август Тон
UPDATE articles SET authors = array_replace(authors, 'А. Тон', 'Август Тон') WHERE 'А. Тон' = ANY(authors);
