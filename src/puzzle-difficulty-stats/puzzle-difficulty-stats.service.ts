// src/puzzle-difficulty-stats/puzzle-difficulty-stats.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleDifficultyStat } from './entities/puzzle-difficulty-stat.entity';

@Injectable()
export class PuzzleDifficultyStatsService {
  constructor(
    @InjectRepository(PuzzleDifficultyStat)
    private readonly statsRepository: Repository<PuzzleDifficultyStat>,
  ) {}

  /**
   * Increments the solve count for a given difficulty level.
   * If the level doesn't exist, it creates a new entry.
   * @param difficultyLevel The difficulty level to increment.
   * @returns The updated or newly created stat.
   */
  async incrementSolveCount(
    difficultyLevel: string,
  ): Promise<PuzzleDifficultyStat> {
    let stat = await this.statsRepository.findOneBy({ difficultyLevel });

    if (stat) {
      stat.solveCount += 1;
    } else {
      stat = this.statsRepository.create({ difficultyLevel, solveCount: 1 });
    }

    return this.statsRepository.save(stat);
  }

  /**
   * Finds all puzzle difficulty statistics.
   * @returns An array of all stats.
   */
  findAll(): Promise<PuzzleDifficultyStat[]> {
    return this.statsRepository.find();
  }

  /**
   * Finds a puzzle difficulty stat by its level.
   * @param difficultyLevel The difficulty level to find.
   * @returns The stat for the given level.
   */
  async findByDifficulty(
    difficultyLevel: string,
  ): Promise<PuzzleDifficultyStat> {
    const stat = await this.statsRepository.findOneBy({ difficultyLevel });
    if (!stat) {
      throw new NotFoundException(
        `Stat for difficulty level "${difficultyLevel}" not found.`,
      );
    }
    return stat;
  }
}