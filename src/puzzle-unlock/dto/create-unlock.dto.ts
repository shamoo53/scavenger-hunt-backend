import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, Min, IsObject, IsBoolean } from 'class-validator';
import { UnlockType } from '../entities/unlock.entity';

export class CreateUnlockDto {
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
  @Min(0)
  tokenCost?: number;

  @IsOptional()
  @IsString()
  requiredPuzzleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredLevel?: number;

  @IsOptional()
  @IsString()
  requiredAchievement?: string;

  @IsOptional()
  @IsDateString()
  unlockTime?: string;

  @IsOptional()
  @IsDateString()
  expiryTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}