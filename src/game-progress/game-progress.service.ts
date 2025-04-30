import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress } from './entities/game-progress.entity';
import { Game } from '../games/entities/game.entity';
import { GameProgressDto } from './dto/game-progress.dto';
import { GameProgressResponseDto } from './dto/game-progress-response.dto';

@Injectable()
export class GameProgressService {
  constructor(
    @InjectRepository(GameProgress)
    private gameProgressRepository: Repository<GameProgress>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
  ) {}

  /**
   * Get user's progress across all games
   * @param userId The ID of the user
   * @returns The user's progress data for all games
   */
  async getUserGameProgress(userId: number): Promise<GameProgressResponseDto> {
    // Get all games
    const allGames = await this.gameRepository.find();
    
    // Get the user's progress for all games they've played
    const userProgress = await this.gameProgressRepository.find({
      where: { userId },
      relations: ['game', 'achievements'],
    });

    // Map user progress data to DTOs
    const gameProgressList: GameProgressDto[] = allGames.map(game => {
      // Find user progress for this game, if it exists
      const progressForGame = userProgress.find(progress => progress.gameId === game.id);
      
      if (progressForGame) {
        return {
          gameId: game.id,
          gameName: game.name,
          currentLevel: progressForGame.currentLevel,
          percentageCompleted: progressForGame.percentageCompleted,
          lastPlayedAt: progressForGame.updatedAt,
          achievements: progressForGame.achievements.map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            unlockedAt: achievement.unlockedAt,
          })),
          hasStarted: true,
        };
      } else {
        // Return default progress data for games the user hasn't started
        return {
          gameId: game.id,
          gameName: game.name,
          currentLevel: 0,
          percentageCompleted: 0,
          achievements: [],
          hasStarted: false,
        };
      }
    });

    return {
      userId,
      totalGames: allGames.length,
      gamesStarted: userProgress.length,
      gamesCompleted: userProgress.filter(progress => progress.percentageCompleted === 100).length,
      gameProgress: gameProgressList,
    };
  }
}