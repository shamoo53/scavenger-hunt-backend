import { Test, TestingModule } from '@nestjs/testing';
import { GameProgressService } from './game-progress.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameProgress } from './entities/game-progress.entity';
import { Game } from '../games/entities/game.entity';
import { Repository } from 'typeorm';

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
});