import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNewsController } from './starknet-news.controller';
import { StarknetNews } from './entities/news.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StarknetNews])],
  controllers: [StarknetNewsController],
  providers: [StarknetNewsService],
  exports: [StarknetNewsService],
})
export class StarknetNewsModule {}
