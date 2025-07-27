import { IsEnum, IsOptional, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BookmarkType } from '../entities/bookmark.entity';

export class QueryBookmarkDto {
  @IsUUID()
  @IsOptional()
  playerId?: string;

  @IsUUID()
  @IsOptional()
  itemId?: string;

  @IsEnum(BookmarkType)
  @IsOptional()
  type?: BookmarkType;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  sortBy?: 'createdAt' | 'updatedAt' | 'title' = 'createdAt';

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'desc';
}
