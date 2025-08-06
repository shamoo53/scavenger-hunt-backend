// src/puzzle-difficulty-stats/puzzle-difficulty-stats.controller.ts

import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PuzzleDifficultyStatsService } from './puzzle-difficulty-stats.service';
import { UpdatePuzzleStatDto } from './dto/update-puzzle-stat.dto';

@Controller('puzzle-difficulty-stats')
export class PuzzleDifficultyStatsController {
  constructor(
    private readonly statsService: PuzzleDifficultyStatsService,
  ) {}

  @Post('increment/:difficultyLevel')
  @HttpCode(HttpStatus.OK)
  increment(@Param() params: UpdatePuzzleStatDto) {
    return this.statsService.incrementSolveCount(params.difficultyLevel);
  }

  @Get()
  findAll() {
    return this.statsService.findAll();
  }

  @Get(':difficultyLevel')
  findByDifficulty(@Param() params: UpdatePuzzleStatDto) {
    return this.statsService.findByDifficulty(params.difficultyLevel);
  }
}