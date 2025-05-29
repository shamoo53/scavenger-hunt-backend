import { Module } from '@nestjs/common';
import { PuzzleController } from './controllers/puzzle.controller';
import { SearchController } from './controllers/search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleService } from './services/puzzle.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle])],
  controllers: [PuzzleController, SearchController],
  providers: [PuzzleService, SearchService],
})
export class PuzzleModule {}
