import {
  IsString,
  IsUrl,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string = 'general';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;
}
