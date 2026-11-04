-- Single source of truth for all four implementations
CREATE TABLE book_category (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE book (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  author      VARCHAR(100) NOT NULL,
  category_id INT NOT NULL REFERENCES book_category(id),
  stock       INT NOT NULL DEFAULT 0
);

CREATE TABLE library_user (  -- "user" is a reserved word in PostgreSQL
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL
);

CREATE TABLE loan (
  id          SERIAL PRIMARY KEY,
  book_id     INT NOT NULL REFERENCES book(id),
  user_id     INT NOT NULL REFERENCES library_user(id),
  loaned_at   TIMESTAMP NOT NULL,
  returned_at TIMESTAMP
);

-- Same indexes for every approach
CREATE INDEX idx_book_category ON book(category_id);
CREATE INDEX idx_loan_book ON loan(book_id);
CREATE INDEX idx_loan_user ON loan(user_id);
