-- Reset before every run
TRUNCATE loan, book, library_user, book_category RESTART IDENTITY CASCADE;

INSERT INTO book_category (name)
SELECT 'Category ' || g FROM generate_series(1, 20) g;

INSERT INTO book (title, author, category_id, stock)
SELECT 'Book ' || g, 'Author ' || (g % 500), (g % 20) + 1, (g % 50) + 1
FROM generate_series(1, 10000) g;

INSERT INTO library_user (name, email)
SELECT 'User ' || g, 'user' || g || '@example.com'
FROM generate_series(1, 1000) g;

INSERT INTO loan (book_id, user_id, loaned_at, returned_at)
SELECT (g % 10000) + 1, (g % 1000) + 1,
       TIMESTAMP '2026-01-01 00:00:00' - (g || ' hours')::interval, NULL
FROM generate_series(1, 20000) g;
