import { ApiProperty } from '@nestjs/swagger';

export class AchievementDto {
  @ApiProperty({ description: 'Unique identifier of the achievement' })
  id: number;

  @ApiProperty({ description: 'Name of the achievement' })
  name: string;

  @ApiProperty({ description: 'Description of the achievement' })
  description: string;

  @ApiProperty({ description: 'Date when the achievement was unlocked' })
  unlockedAt: Date;
}