import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const bookCategory = pgTable('book_category', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const book = pgTable('book', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  author: varchar('author', { length: 100 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => bookCategory.id),
  stock: integer('stock').notNull().default(0),
});

export const libraryUser = pgTable('library_user', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull(),
});

export const loan = pgTable('loan', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id').notNull().references(() => book.id),
  userId: integer('user_id').notNull().references(() => libraryUser.id),
  loanedAt: timestamp('loaned_at').notNull(),
  returnedAt: timestamp('returned_at'),
});