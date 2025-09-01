import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import {
  AnnouncementStatus,
  AnnouncementPriority,
} from '../enums/announcement.enum';

export class BulkAnnouncementActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsString()
  @IsEnum([
    'publish',
    'unpublish',
    'archive',
    'delete',
    'pin',
    'unpin',
    'feature',
    'unfeature',
    'activate',
    'deactivate',
  ])
  action:
    | 'publish'
    | 'unpublish'
    | 'archive'
    | 'delete'
    | 'pin'
    | 'unpin'
    | 'feature'
    | 'unfeature'
    | 'activate'
    | 'deactivate';

  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  updatedByName?: string;
}

export class AnnouncementEngagementDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  views?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  clicks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  acknowledgments?: number;
}

export class AnnouncementStatsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number = 30;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class ParticipantActionDto {
  @IsUUID()
  userId: string;

  @IsString()
  userName: string;

  @IsEnum(['join', 'leave'])
  action: 'join' | 'leave';
}

export class AnnouncementAcknowledgmentDto {
  @IsUUID()
  userId: string;

  @IsString()
  userName: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
