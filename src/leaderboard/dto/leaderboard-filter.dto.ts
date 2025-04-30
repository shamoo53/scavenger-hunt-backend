import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator"
import { Type } from "class-transformer"
import { PaginationDto } from "../../common/dto/pagination.dto"

export enum TimeFrame {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ALL_TIME = "all_time",
}

export class LeaderboardFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  playerName?: string

  @IsOptional()
  @IsString()
  gameId?: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minScore?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxScore?: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsEnum(TimeFrame)
  timeFrame?: TimeFrame

  @IsOptional()
  @IsString()
  sortBy?: string = "score"

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC"
}
