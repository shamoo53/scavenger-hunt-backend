import {
  IsString,
  IsUrl,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  sourceUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string = 'general';

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @IsOptional()
  @Type(() => Date)
  scheduledFor?: Date;

  // SEO Metadata
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @IsOptional()
  additionalMetadata?: Record<string, any>;
}
