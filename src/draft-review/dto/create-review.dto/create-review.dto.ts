import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsString()
  feedback?: string;

  @IsEnum(['approved', 'rejected', 'pending'])
  status: 'approved' | 'rejected' | 'pending';
}
