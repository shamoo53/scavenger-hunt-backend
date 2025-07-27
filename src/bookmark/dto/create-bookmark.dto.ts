import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsObject } from 'class-validator';
import { BookmarkType } from '../entities/bookmark.entity';

export class CreateBookmarkDto {
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(BookmarkType)
  @IsNotEmpty()
  type: BookmarkType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
