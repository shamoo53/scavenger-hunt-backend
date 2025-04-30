import { ApiProperty } from '@nestjs/swagger';
import { GameProgressDto } from './game-progress.dto';

export class GameProgressResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ description: 'Total number of games available' })
  totalGames: number;

  @ApiProperty({ description: 'Number of games started by the user' })
  gamesStarted: number;

  @ApiProperty({ description: 'Number of games completed by the user' })
  gamesCompleted: number;

  @ApiProperty({
    type: [GameProgressDto],
    description: 'List of progress data for each game'
  })
  gameProgress: GameProgressDto[];
}