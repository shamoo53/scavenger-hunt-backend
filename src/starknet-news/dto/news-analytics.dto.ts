import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  MaxLength,
  IsArray,
} from 'class-validator';

export class NewsEngagementDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  views?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  likes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  shares?: number;
}

export class NewsAnalyticsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number = 30;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class BulkNewsActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsString()
  action:
    | 'publish'
    | 'unpublish'
    | 'delete'
    | 'archive'
    | 'feature'
    | 'unfeature';
}
