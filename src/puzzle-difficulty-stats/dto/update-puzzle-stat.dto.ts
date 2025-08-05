// src/puzzle-difficulty-stats/dto/update-puzzle-stat.dto.ts

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePuzzleStatDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  readonly difficultyLevel: string;
}