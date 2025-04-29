import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPuzzleDto {
  @IsNotEmpty()
  @IsString()
  puzzleId: string;

  @IsNotEmpty()
  @IsString()
  answer: string;
}