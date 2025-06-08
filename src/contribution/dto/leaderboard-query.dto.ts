mport { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum LeaderboardPeriod {
  ALL_TIME = 'all_time',
  THIS_MONTH = 'this_month',
  THIS_WEEK = 'this_week',
  TODAY = 'today',
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsEnum(LeaderboardPeriod)
  period?: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}