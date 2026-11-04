import { Controller, Get, Inject } from '@nestjs/common';
import * as repositoryInterface from '../data-access/repository.interface';

const RESPONSE_LIMIT = 100;

@Controller('loans')
export class LoansController {
  constructor(
    @Inject(repositoryInterface.BOOK_REPOSITORY) private readonly repo: repositoryInterface.BookRepository,
  ) {}

  // Join: loan + book + user
  @Get('details')
  findLoanDetails() {
    return this.repo.findLoanDetails(RESPONSE_LIMIT);
  }
}