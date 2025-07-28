import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { UnlockType } from '../entities/unlock.entity';

export class UnlockPuzzleDto {
  @IsString()
  userId: string;

  @IsString()
  puzzleId: string;

  @IsEnum(UnlockType)
  unlockType: UnlockType;

  @IsOptional()
  @IsString()
  unlockKey?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokensToSpend?: number;

  @IsOptional()
  @IsString()
  completedPuzzleId?: string;
}
