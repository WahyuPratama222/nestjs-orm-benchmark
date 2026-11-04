import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import {
  BookDto, BookRepository, BookStatDto, CreateBookInput, LoanDetailDto,
} from '../repository.interface';
import { PG_POOL } from './raw.constants';

@Injectable()
export class RawBookRepository implements BookRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Read
  async findBooks(limit: number): Promise<BookDto[]> {
    const { rows } = await this.pool.query(
      `SELECT id, title, author, category_id AS "categoryId", stock
       FROM book
       ORDER BY id
       LIMIT $1`,
      [limit],
    );
    return rows;
  }

  // Create
  async createBook(input: CreateBookInput): Promise<BookDto> {
    const { rows } = await this.pool.query(
      `INSERT INTO book (title, author, category_id, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, author, category_id AS "categoryId", stock`,
      [input.title, input.author, input.categoryId, input.stock],
    );
    return rows[0];
  }

  // Join: loan + book + user
  async findLoanDetails(limit: number): Promise<LoanDetailDto[]> {
    const { rows } = await this.pool.query(
      `SELECT l.id,
              b.title AS "bookTitle",
              u.name  AS "userName",
              l.loaned_at AS "loanedAt"
       FROM loan l
       JOIN book b ON b.id = l.book_id
       JOIN library_user u ON u.id = l.user_id
       ORDER BY l.id
       LIMIT $1`,
      [limit],
    );
    return rows;
  }

  // Group By: bigint aggregates are cast to int so the JSON matches the ORMs
  async getBookStats(): Promise<BookStatDto[]> {
    const { rows } = await this.pool.query(
      `SELECT category_id AS "categoryId",
              COUNT(*)::int AS "totalBooks",
              SUM(stock)::int AS "totalStock"
       FROM book
       GROUP BY category_id
       ORDER BY category_id`,
    );
    return rows;
  }
}