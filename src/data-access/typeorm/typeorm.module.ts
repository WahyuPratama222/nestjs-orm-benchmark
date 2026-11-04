import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getPoolSettings } from '../../common/pg-pool';
import { BOOK_REPOSITORY } from '../repository.interface';
import { BookCategory } from './entities/book-category.entity';
import { Book } from './entities/book.entity';
import { LibraryUser } from './entities/library-user.entity';
import { Loan } from './entities/loan.entity';
import { TypeOrmBookRepository } from './typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // Async factory so env vars are read at startup, after ConfigModule
      useFactory: (): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Book, BookCategory, LibraryUser, Loan],
        synchronize: false, // tables come from db/schema.sql
        logging: ['error'],
        extra: getPoolSettings(), // passed straight to pg.Pool
      }),
    }),
    TypeOrmModule.forFeature([Book, Loan]),
  ],
  providers: [{ provide: BOOK_REPOSITORY, useClass: TypeOrmBookRepository }],
  exports: [BOOK_REPOSITORY],
})
export class TypeOrmDataModule {}