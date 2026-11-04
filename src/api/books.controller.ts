import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CreateBookDto } from '../common/dto/create-book.dto';
import * as repositoryInterface from '../data-access/repository.interface';

const RESPONSE_LIMIT = 100; // fixed response size for every run

@Controller('books')
export class BooksController {
  constructor(
    @Inject(repositoryInterface.BOOK_REPOSITORY) private readonly repo: repositoryInterface.BookRepository,
  ) {}

  // Read
  @Get()
  findBooks() {
    return this.repo.findBooks(RESPONSE_LIMIT);
  }

  // Group By
  @Get('stats')
  getBookStats() {
    return this.repo.getBookStats();
  }

  // Create
  @Post()
  createBook(@Body() body: CreateBookDto) {
    return this.repo.createBook(body);
  }
}