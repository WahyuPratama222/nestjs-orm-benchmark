import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookDto,
  BookRepository,
  BookStatDto,
  CreateBookInput,
  LoanDetailDto,
} from '../repository.interface';
import { Book } from './entities/book.entity';
import { Loan } from './entities/loan.entity';

@Injectable()
export class TypeOrmBookRepository implements BookRepository {
  constructor(
    @InjectRepository(Book) private readonly books: Repository<Book>,
    @InjectRepository(Loan) private readonly loans: Repository<Loan>,
  ) {}

  // Read
  findBooks(limit: number): Promise<BookDto[]> {
    return this.books.find({ order: { id: 'ASC' }, take: limit });
  }

  // Create: single INSERT ... RETURNING via the insert query builder
  async createBook(input: CreateBookInput): Promise<BookDto> {
    const result = await this.books
      .createQueryBuilder()
      .insert()
      .values({
        title: input.title,
        author: input.author,
        categoryId: input.categoryId,
        stock: input.stock,
      })
      .returning(['id', 'title', 'author', 'categoryId', 'stock']) // property names
      .execute();

    const row = result.raw[0]; // raw keys are DB column names
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      categoryId: row.category_id,
      stock: row.stock,
    };
  }

  // Join: loan + book + user, projected without entity hydration
  async findLoanDetails(limit: number): Promise<LoanDetailDto[]> {
    return this.loans
      .createQueryBuilder('l')
      .innerJoin('l.book', 'b')
      .innerJoin('l.user', 'u')
      .select('l.id', 'id')
      .addSelect('b.title', 'bookTitle')
      .addSelect('u.name', 'userName')
      .addSelect('l.loanedAt', 'loanedAt')
      .orderBy('l.id', 'ASC')
      .limit(limit)
      .getRawMany();
  }

  // Group By: aggregates come back as strings, so convert them
  async getBookStats(): Promise<BookStatDto[]> {
    const rows = await this.books
      .createQueryBuilder('b')
      .select('b.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'totalBooks')
      .addSelect('SUM(b.stock)', 'totalStock')
      .groupBy('b.categoryId')
      .orderBy('b.categoryId', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      categoryId: r.categoryId,
      totalBooks: Number(r.totalBooks),
      totalStock: Number(r.totalStock),
    }));
  }
}