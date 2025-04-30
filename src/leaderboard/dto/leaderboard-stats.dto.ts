import { IsDateString, IsOptional, IsString } from "class-validator"

export class LeaderboardStatsDto {
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
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}
