import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCronJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  content: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = false;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;
}
