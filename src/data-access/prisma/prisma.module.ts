// src/data-access/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { BOOK_REPOSITORY } from '../repository.interface';
import { PrismaService } from './prisma.service';
import { PrismaBookRepository } from './prisma.repository';

@Module({
  providers: [
    PrismaService,
    { provide: BOOK_REPOSITORY, useClass: PrismaBookRepository },
  ],
  exports: [BOOK_REPOSITORY],
})
export class PrismaDataModule {}