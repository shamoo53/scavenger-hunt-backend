import { ApiProperty } from '@nestjs/swagger';
import { AchievementDto } from './achievement.dto';

export class GameProgressDto {
  @ApiProperty({ description: 'Unique identifier of the game' })
  gameId: number;

  @ApiProperty({ description: 'Name of the game' })
  gameName: string;

  @ApiProperty({ description: 'Current level of the user in the game' })
  currentLevel: number;

  @ApiProperty({ description: 'Percentage of game completed (0-100)' })
  percentageCompleted: number;

  @ApiProperty({ 
    description: 'Date when the game was last played',
    required: false,
    nullable: true
  })
  lastPlayedAt?: Date;

  @ApiProperty({ description: 'Whether the user has started playing this game' })
  hasStarted: boolean;

  @ApiProperty({
    type: [AchievementDto],
    description: 'List of achievements unlocked by the user'
  })
  achievements: AchievementDto[];
}