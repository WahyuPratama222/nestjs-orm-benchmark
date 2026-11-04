import { Inject, Injectable } from '@nestjs/common';
import { count, eq, sum } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  BookDto, BookRepository, BookStatDto, CreateBookInput, LoanDetailDto,
} from '../repository.interface';
import { DRIZZLE_DB } from './drizzle.constants';
import { book, libraryUser, loan } from './schema';

@Injectable()
export class DrizzleBookRepository implements BookRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  // Read
  findBooks(limit: number): Promise<BookDto[]> {
    return this.db.select().from(book).orderBy(book.id).limit(limit);
  }

  // Create
  async createBook(input: CreateBookInput): Promise<BookDto> {
    const [row] = await this.db
      .insert(book)
      .values({
        title: input.title,
        author: input.author,
        categoryId: input.categoryId,
        stock: input.stock,
      })
      .returning();
    return row;
  }

  // Join: loan + book + user (partial select returns the flat shape directly)
  findLoanDetails(limit: number): Promise<LoanDetailDto[]> {
    return this.db
      .select({
        id: loan.id,
        bookTitle: book.title,
        userName: libraryUser.name,
        loanedAt: loan.loanedAt,
      })
      .from(loan)
      .innerJoin(book, eq(book.id, loan.bookId))
      .innerJoin(libraryUser, eq(libraryUser.id, loan.userId))
      .orderBy(loan.id)
      .limit(limit);
  }

  // Group By: Drizzle's sum() returns a string (or null), so convert it
  async getBookStats(): Promise<BookStatDto[]> {
    const rows = await this.db
      .select({
        categoryId: book.categoryId,
        totalBooks: count(),
        totalStock: sum(book.stock),
      })
      .from(book)
      .groupBy(book.categoryId)
      .orderBy(book.categoryId);

    return rows.map((r) => ({
      categoryId: r.categoryId,
      totalBooks: r.totalBooks,
      totalStock: Number(r.totalStock ?? 0),
    }));
  }
}