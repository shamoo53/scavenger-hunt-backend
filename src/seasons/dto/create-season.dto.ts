import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  rewards?: any;
}
