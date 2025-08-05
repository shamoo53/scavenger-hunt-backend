// src/starknet-quiz/test/starknet-quiz.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StarknetQuizService } from '../starknet-quiz.service';
import { StarknetQuiz } from '../entities/starknet-quiz.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateStarknetQuizDto } from '../dto/create-starknet-quiz.dto';

describe('StarknetQuizService', () => {
  let service: StarknetQuizService;
  let repository: Repository<StarknetQuiz>;

  const mockQuiz: StarknetQuiz = {
    id: 'a-uuid',
    question: 'What is StarkNet?',
    options: ['L1', 'L2', 'Sidechain'],
    correctAnswer: 'L2',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockQuiz),
    save: jest.fn().mockResolvedValue(mockQuiz),
    find: jest.fn().mockResolvedValue([mockQuiz]),
    findOneBy: jest.fn().mockResolvedValue(mockQuiz),
    preload: jest.fn().mockResolvedValue(mockQuiz),
    remove: jest.fn().mockResolvedValue(mockQuiz),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarknetQuizService,
        {
          provide: getRepositoryToken(StarknetQuiz),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StarknetQuizService>(StarknetQuizService);
    repository = module.get<Repository<StarknetQuiz>>(
      getRepositoryToken(StarknetQuiz),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a quiz', async () => {
      const createDto: CreateStarknetQuizDto = {
        question: 'What is StarkNet?',
        options: ['L1', 'L2', 'Sidechain'],
        correctAnswer: 'L2',
      };
      const result = await service.create(createDto);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockQuiz);
      expect(result).toEqual(mockQuiz);
    });
  });

  describe('findAll', () => {
    it('should return an array of quizzes', async () => {
      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockQuiz]);
    });
  });

  describe('findOne', () => {
    it('should find and return a quiz by ID', async () => {
      const result = await service.findOne('a-uuid');
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'a-uuid' });
      expect(result).toEqual(mockQuiz);
    });

    it('should throw NotFoundException if quiz not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a quiz and return a success message', async () => {
      const result = await service.remove('a-uuid');
      expect(repository.remove).toHaveBeenCalledWith(mockQuiz);
      expect(result).toEqual({
        id: 'a-uuid',
        message: 'Successfully deleted quiz question.',
      });
    });
  });
});