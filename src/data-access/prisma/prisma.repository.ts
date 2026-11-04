import { Injectable } from '@nestjs/common';
import {
  BookDto, BookRepository, BookStatDto, CreateBookInput, LoanDetailDto,
} from '../repository.interface';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaBookRepository implements BookRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Read
  findBooks(limit: number): Promise<BookDto[]> {
    return this.prisma.book.findMany({
      take: limit,
      orderBy: { id: 'asc' },
    });
  }

  // Create
  createBook(input: CreateBookInput): Promise<BookDto> {
    return this.prisma.book.create({
      data: {
        title: input.title,
        author: input.author,
        categoryId: input.categoryId,
        stock: input.stock,
      },
    });
  }

  // Join: loan + book + user (Prisma returns nested objects, so flatten them)
  async findLoanDetails(limit: number): Promise<LoanDetailDto[]> {
    const loans = await this.prisma.loan.findMany({
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        loanedAt: true,
        book: { select: { title: true } },
        user: { select: { name: true } },
      },
    });
    return loans.map((l: any) => ({
      id: l.id,
      bookTitle: l.book.title,
      userName: l.user.name,
      loanedAt: l.loanedAt,
    }));
  }

  // Group By
  async getBookStats(): Promise<BookStatDto[]> {
    const rows = await this.prisma.book.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      _sum: { stock: true },
      orderBy: { categoryId: 'asc' },
    });
    return rows.map((r: any) => ({
      categoryId: r.categoryId,
      totalBooks: r._count._all,
      totalStock: r._sum.stock ?? 0,
    }));
  }
}