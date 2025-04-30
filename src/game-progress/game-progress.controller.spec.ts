import { Test, TestingModule } from '@nestjs/testing';
import { GameProgressController } from './game-progress.controller';
import { GameProgressService } from './game-progress.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameProgress } from './entities/game-progress.entity';
import { Game } from '../games/entities/game.entity';
import { GameProgressResponseDto } from './dto/game-progress-response.dto';

describe('GameProgressController', () => {
  let controller: GameProgressController;
  let service: GameProgressService;

  const mockGameProgressRepository = {
    find: jest.fn(),
  };

  const mockGameRepository = {
    find: jest.fn(),
  };

  const mockUser = { id: 1, email: 'test@example.com' };
  const mockRequest = { user: mockUser };

  const mockGameProgressResponse: GameProgressResponseDto = {
    userId: 1,
    totalGames: 2,
    gamesStarted: 1,
    gamesCompleted: 0,
    gameProgress: [
      {
        gameId: 1,
        gameName: 'Game 1',
        currentLevel: 2,
        percentageCompleted: 50,
        lastPlayedAt: new Date(),
        hasStarted: true,
        achievements: [
          {
            id: 1,
            name: 'First Steps',
            description: 'Started the game',
            unlockedAt: new Date(),
          },
        ],
      },
      {
        gameId: 2,
        gameName: 'Game 2',
        currentLevel: 0,
        percentageCompleted: 0,
        hasStarted: false,
        achievements: [],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameProgressController],
      providers: [
        GameProgressService,
        {
          provide: getRepositoryToken(GameProgress),
          useValue: mockGameProgressRepository,
        },
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepository,
        },
      ],
    }).compile();

    controller = module.get<GameProgressController>(GameProgressController);
    service = module.get<GameProgressService>(GameProgressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserGameProgress', () => {
    it('should return user game progress', async () => {
      jest.spyOn(service, 'getUserGameProgress').mockResolvedValue(mockGameProgressResponse);

      const result = await controller.getUserGameProgress(mockRequest as any);
      
      expect(service.getUserGameProgress).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockGameProgressResponse);
    });
  });
});
