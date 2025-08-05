// src/puzzle-difficulty-stats/test/puzzle-difficulty-stats.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleDifficultyStatsService } from '../puzzle-difficulty-stats.service';
import { PuzzleDifficultyStat } from '../entities/puzzle-difficulty-stat.entity';
import { NotFoundException } from '@nestjs/common';

describe('PuzzleDifficultyStatsService', () => {
  let service: PuzzleDifficultyStatsService;
  let repository: Repository<PuzzleDifficultyStat>;

  const mockStat = {
    id: 'uuid-easy',
    difficultyLevel: 'easy',
    solveCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleDifficultyStatsService,
        {
          provide: getRepositoryToken(PuzzleDifficultyStat),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PuzzleDifficultyStatsService>(
      PuzzleDifficultyStatsService,
    );
    repository = module.get<Repository<PuzzleDifficultyStat>>(
      getRepositoryToken(PuzzleDifficultyStat),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('incrementSolveCount', () => {
    it('should increment count if stat exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockStat);
      mockRepository.save.mockImplementation(async (stat) => stat);

      const result = await service.incrementSolveCount('easy');

      expect(result.solveCount).toBe(6);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        difficultyLevel: 'easy',
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockStat,
        solveCount: 6,
      });
    });

    it('should create a new stat with count 1 if it does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      const newStat = { difficultyLevel: 'hard', solveCount: 1 };
      mockRepository.create.mockReturnValue(newStat);
      mockRepository.save.mockResolvedValue(newStat);

      const result = await service.incrementSolveCount('hard');

      expect(result.solveCount).toBe(1);
      expect(result.difficultyLevel).toBe('hard');
      expect(mockRepository.create).toHaveBeenCalledWith({
        difficultyLevel: 'hard',
        solveCount: 1,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newStat);
    });
  });

  describe('findByDifficulty', () => {
    it('should return a stat if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockStat);
      const result = await service.findByDifficulty('easy');
      expect(result).toEqual(mockStat);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findByDifficulty('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of stats', async () => {
      const statsArray = [mockStat];
      mockRepository.find.mockResolvedValue(statsArray);
      const result = await service.findAll();
      expect(result).toEqual(statsArray);
    });
  });
});