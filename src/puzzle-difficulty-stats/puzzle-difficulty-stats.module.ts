// src/puzzle-difficulty-stats/puzzle-difficulty-stats.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleDifficultyStatsService } from './puzzle-difficulty-stats.service';
import { PuzzleDifficultyStatsController } from './puzzle-difficulty-stats.controller';
import { PuzzleDifficultyStat } from './entities/puzzle-difficulty-stat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PuzzleDifficultyStat])],
  controllers: [PuzzleDifficultyStatsController],
  providers: [PuzzleDifficultyStatsService],
})
export class PuzzleDifficultyStatsModule {}