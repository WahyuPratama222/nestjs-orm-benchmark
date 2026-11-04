import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { DataAccessModule } from './data-access/data-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DataAccessModule.register(),
    ApiModule,
  ],
})
export class AppModule {}