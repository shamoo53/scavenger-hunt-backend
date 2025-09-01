import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNewsController } from './starknet-news.controller';
import { StarknetNews } from './entities/news.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StarknetNews]), ScheduleModule.forRoot()],
  controllers: [StarknetNewsController],
  providers: [StarknetNewsService],
  exports: [StarknetNewsService],
})
export class StarknetNewsModule {}
