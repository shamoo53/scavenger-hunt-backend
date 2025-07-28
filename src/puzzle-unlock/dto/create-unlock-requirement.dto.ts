import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsObject, Min } from 'class-validator';
import { UnlockType } from '../entities/unlock.entity';

export class CreateUnlockRequirementDto {
  @IsString()
  puzzleId: string;

  @IsEnum(UnlockType)
  unlockType: UnlockType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = true;

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
  @IsNumber()
  @Min(0)
  timeDelayHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiryHours?: number;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}