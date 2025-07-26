import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsInt, Min, IsObject, IsDateString } from 'class-validator';
import { CreateProgressDto } from './create-progress.dto';
import { ProgressStatus } from '../entities/progress.entity';

export class UpdateProgressDto extends PartialType(CreateProgressDto) {
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
  attempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  completedAt?: Date;
}