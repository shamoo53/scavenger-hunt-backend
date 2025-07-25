import { IsString, IsEnum, IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { ProgressStatus } from '../entities/progress.entity';

export class CreateProgressDto {
  @IsString()
  puzzleId: string;

  @IsOptional()
  @IsEnum(ProgressStatus)
  status?: ProgressStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  attempts?: number; f
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}