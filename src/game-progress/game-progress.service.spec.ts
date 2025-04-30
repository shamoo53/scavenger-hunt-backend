import { Test, TestingModule } from '@nestjs/testing';
import { GameProgressService } from './game-progress.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameProgress } from './entities/game-progress.entity';
import { Game } from '../games/entities/game.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('GameProgressService', () => {
  let service: GameProgressService;
  let gameProgressRepository: Repository<GameProgress>;
  let gameRepository: Repository<Game>;

  const mockGames = [
    { id: 1, name: 'Game 1', description: 'First game', isActive: true },
    { id: 2, name: 'Game 2', description: 'Second game', isActive: true },
  ];

  const mockGameProgress = [
    {
      id: 1,
      userId: 1,
      gameId: 1,
      currentLevel: 2,
      percentageCompleted: 50,
      updatedAt: new Date(),
      game: mockGames[0],
      achievements: [
        {
          id: 1,
          name: 'First Steps',
          description: 'Started the game',
          unlockedAt: new Date(),
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameProgressService,
        {
          provide: getRepositoryToken(GameProgress),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Game),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GameProgressService>(GameProgressService);
    gameProgressRepository = module.get<Repository<GameProgress>>(getRepositoryToken(GameProgress));
    gameRepository = module.get<Repository<Game>>(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserGameProgress', () => {
    it('should return user game progress data for all games', async () => {
      jest.spyOn(gameRepository, 'find').mockResolvedValue(mockGames as any);
      jest.spyOn(gameProgressRepository, 'find').mockResolvedValue(mockGameProgress as any);

      const result = await service.getUserGameProgress(1);

      expect(gameRepository.find).toHaveBeenCalled();
      expect(gameProgressRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['game', 'achievements'],
      });

      expect(result.userId).toBe(1);
      expect(result.totalGames).toBe(2);
      expect(result.gamesStarted).toBe(1);
      expect(result.gamesCompleted).toBe(0);
      expect(result.gameProgress.length).toBe(2);
      
      // Check first game (with progress)
      expect(result.gameProgress[0].gameId).toBe(1);
      expect(result.gameProgress[0].hasStarted).toBe(true);
      expect(result.gameProgress[0].achievements.length).toBe(1);
      
      // Check second game (no progress)
      expect(result.gameProgress[1].gameId).toBe(2);
      expect(result.gameProgress[1].hasStarted).toBe(false);
      expect(result.gameProgress[1].percentageCompleted).toBe(0);
    });
  });

  describe('getUserProgressForGame', () => {
    const mockGame = { id: 1, name: 'Game 1', description: 'First game', isActive: true };
    
    const mockGameProgress = {
      id: 1,
      userId: 1,
      gameId: 1,
      currentLevel: 2,
      percentageCompleted: 50,
      score: 120,
      challengesCompleted: 3,
      totalChallenges: 10,
      updatedAt: new Date(),
      game: mockGame,
      achievements: [
        {
          id: 1,
          name: 'First Steps',
          description: 'Started the game',
          unlockedAt: new Date(),
        },
      ],
    };
  
    it('should return user progress for a specific game when progress exists', async () => {
      jest.spyOn(gameRepository, 'findOne').mockResolvedValue(mockGame as any);
      jest.spyOn(gameProgressRepository, 'findOne').mockResolvedValue(mockGameProgress as any);
  
      const result = await service.getUserProgressForGame(1, 1);
  
      expect(gameRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(gameProgressRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1, gameId: 1 },
        relations: ['achievements', 'game'],
      });
  
      expect(result.userId).toBe(1);
      expect(result.gameId).toBe(1);
      expect(result.currentLevel).toBe(2);
      expect(result.percentageCompleted).toBe(50);
      expect(result.score).toBe(120);
      expect(result.challengesCompleted).toBe(3);
      expect(result.hasStarted).toBe(true);
      expect(result.achievements.length).toBe(1);
    });
  
    it('should return default progress when user has not started the game', async () => {
      jest.spyOn(gameRepository, 'findOne').mockResolvedValue(mockGame as any);
      jest.spyOn(gameProgressRepository, 'findOne').mockResolvedValue(null);
  
      const result = await service.getUserProgressForGame(1, 1);
  
      expect(result.userId).toBe(1);
      expect(result.gameId).toBe(1);
      expect(result.currentLevel).toBe(0);
      expect(result.percentageCompleted).toBe(0);
      expect(result.score).toBe(0);
      expect(result.challengesCompleted).toBe(0);
      expect(result.hasStarted).toBe(false);
      expect(result.achievements).toEqual([]);
    });
  
    it('should throw NotFoundException when game does not exist', async () => {
      jest.spyOn(gameRepository, 'findOne').mockResolvedValue(null);
  
      await expect(service.getUserProgressForGame(1, 999)).rejects.toThrow(NotFoundException);
      expect(gameRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });
});