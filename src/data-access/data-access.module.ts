import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class DataAccessModule {
  static register(): DynamicModule {
    // Read once at startup. Only the selected module is ever required,
    // so the other ORMs are never loaded into memory.
    const mode = process.env.DATA_ACCESS;

    let selected: any;
    switch (mode) {
      case 'prisma':
        selected = require('./prisma/prisma.module').PrismaDataModule;
        break;
      case 'typeorm':
        selected = require('./typeorm/typeorm.module').TypeOrmDataModule;
        break;
      case 'drizzle':
        selected = require('./drizzle/drizzle.module').DrizzleDataModule;
        break;
      case 'raw':
        selected = require('./raw/raw.module').RawDataModule;
        break;
      default:
        throw new Error(
          `DATA_ACCESS must be prisma | typeorm | drizzle | raw, got "${mode}"`,
        );
    }

    return {
      module: DataAccessModule,
      global: true, // controllers can inject BOOK_REPOSITORY without importing it
      imports: [selected],
      exports: [selected],
    };
  }
}