
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ContributionType } from '../enums/contribution-type.enum';

export class CreateContributionDto {
  @IsEnum(ContributionType)
  type: ContributionType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
