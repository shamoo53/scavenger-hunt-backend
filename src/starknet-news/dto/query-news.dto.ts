import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryNewsDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // Date range filtering
  @IsOptional()
  @Type(() => Date)
  publishedAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  publishedBefore?: Date;

  @IsOptional()
  @Type(() => Date)
  scheduledAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  scheduledBefore?: Date;

  // Engagement filtering
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minViews?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minLikes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'publishedAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // Include archived/deleted articles for admin queries
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;
}
