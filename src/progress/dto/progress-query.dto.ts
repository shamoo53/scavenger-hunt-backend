import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProgressStatus } from '../entities/progress.entity';

export class ProgressQueryDto {
  @IsOptional()
  @IsString()
  puzzleId?: string;

  @IsOptional()
  @IsEnum(ProgressStatus)
  status?: ProgressStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}