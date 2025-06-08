import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ContributionStatus } from '../enums/contribution-type.enum';

export class ReviewContributionDto {
  @IsEnum(ContributionStatus)
  status: ContributionStatus;

  @IsNumber()
  @Min(0)
  pointsAwarded: number;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}