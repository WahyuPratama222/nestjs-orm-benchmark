import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { LoansController } from './loans.controller';

@Module({
  controllers: [BooksController, LoansController],
})
export class ApiModule {}