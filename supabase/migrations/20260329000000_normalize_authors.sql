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

-- Артём Карапетов (А.Г. Карапетов)
UPDATE articles SET authors = array_replace(authors, 'А.Г. Карапетов', 'Артём Карапетов') WHERE 'А.Г. Карапетов' = ANY(authors);

-- Белов В.А.
UPDATE articles SET authors = array_replace(authors, 'В.А. Белов', 'Белов В.А.') WHERE 'В.А. Белов' = ANY(authors);

-- Андрей Егоров
UPDATE articles SET authors = array_replace(authors, 'А.В. Егоров', 'Андрей Егоров') WHERE 'А.В. Егоров' = ANY(authors);

-- Антон Асосков
UPDATE articles SET authors = array_replace(authors, 'А.В. Асосков', 'Антон Асосков') WHERE 'А.В. Асосков' = ANY(authors);

-- Одилхон Мадаминов-Ширинский
UPDATE articles SET authors = array_replace(authors, 'Одилхон Мадаминов', 'Одилхон Мадаминов-Ширинский') WHERE 'Одилхон Мадаминов' = ANY(authors);

-- Рыбалов А.О.
UPDATE articles SET authors = array_replace(authors, 'А.О. Рыбалов', 'Рыбалов А.О.') WHERE 'А.О. Рыбалов' = ANY(authors);

-- Сергей Будылин
UPDATE articles SET authors = array_replace(authors, 'С.Л. Будылин', 'Сергей Будылин') WHERE 'С.Л. Будылин' = ANY(authors);

-- Эдуард Евстигнеев
UPDATE articles SET authors = array_replace(authors, 'Э.А. Евстигнеев', 'Эдуард Евстигнеев') WHERE 'Э.А. Евстигнеев' = ANY(authors);

-- Олег Малахов
UPDATE articles SET authors = array_replace(authors, 'О.А. Малахов', 'Олег Малахов') WHERE 'О.А. Малахов' = ANY(authors);

-- Александр Кузнецов
UPDATE articles SET authors = array_replace(authors, 'А.А. Кузнецов', 'Александр Кузнецов') WHERE 'А.А. Кузнецов' = ANY(authors);
UPDATE articles SET authors = array_replace(authors, 'Александр Анатольевич Кузнецов', 'Александр Кузнецов') WHERE 'Александр Анатольевич Кузнецов' = ANY(authors);

-- Юрий Фогельсон
UPDATE articles SET authors = array_replace(authors, 'Фогельсон Ю.Б.', 'Юрий Фогельсон') WHERE 'Фогельсон Ю.Б.' = ANY(authors);

-- Сергей Анашкин
UPDATE articles SET authors = array_replace(authors, 'Сергей Павлович Анашкин', 'Сергей Анашкин') WHERE 'Сергей Павлович Анашкин' = ANY(authors);

-- Юрий Хандкаров
UPDATE articles SET authors = array_replace(authors, 'Юрий Сергеевич Хандкаров', 'Юрий Хандкаров') WHERE 'Юрий Сергеевич Хандкаров' = ANY(authors);

-- Александр Ананьев
UPDATE articles SET authors = array_replace(authors, 'Александр Евгеньевич Ананьев', 'Александр Ананьев') WHERE 'Александр Евгеньевич Ананьев' = ANY(authors);

-- Вера Алейникова
UPDATE articles SET authors = array_replace(authors, 'Вера Васильевна Алейникова', 'Вера Алейникова') WHERE 'Вера Васильевна Алейникова' = ANY(authors);

-- Полина Астапенко
UPDATE articles SET authors = array_replace(authors, 'П.А. Астапенко', 'Полина Астапенко') WHERE 'П.А. Астапенко' = ANY(authors);

-- Станислав Соболев
UPDATE articles SET authors = array_replace(authors, 'Станислав Игоревич Соболев', 'Станислав Соболев') WHERE 'Станислав Игоревич Соболев' = ANY(authors);
