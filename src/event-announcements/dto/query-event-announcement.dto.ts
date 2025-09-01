import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';

export class QueryEventAnnouncementDto {
  // Pagination
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

  // Basic filtering
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

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
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresAcknowledgment?: boolean;

  // Targeting filters
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  targetAudience?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  categories?: string[];

  // Date range filtering
  @IsOptional()
  @Type(() => Date)
  startDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  startDateTo?: Date;

  @IsOptional()
  @Type(() => Date)
  endDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  endDateTo?: Date;

  @IsOptional()
  @Type(() => Date)
  eventDateAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  eventDateBefore?: Date;

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

  @IsOptional()
  @Type(() => Date)
  publishAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  publishBefore?: Date;

  @IsOptional()
  @Type(() => Date)
  createdAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  createdBefore?: Date;

  // Admin filtering
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsString()
  createdByName?: string;

  // Location filtering
  @IsOptional()
  @IsString()
  location?: string;

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
  minClicks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minLikes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minAcknowledgments?: number;

  // Participation filtering
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxParticipants?: number;

  // Full-text search
  @IsOptional()
  @IsString()
  search?: string;

  // Notification settings filters
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendNotification?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendPush?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInDashboard?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showInApp?: boolean;

  // Sorting
  @IsOptional()
  @IsString()
  @IsIn([
    'createdAt',
    'updatedAt',
    'startDate',
    'endDate',
    'publishAt',
    'expireAt',
    'title',
    'priority',
    'type',
    'status',
    'viewCount',
    'clickCount',
    'acknowledgeCount',
    'currentParticipants',
  ])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // Admin options
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExpired?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeScheduled?: boolean = true;

  // Special filters
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean = false; // Filter for currently active announcements

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  upcomingOnly?: boolean = false; // Filter for upcoming events

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ongoingOnly?: boolean = false; // Filter for currently ongoing events
}

export class BulkAnnouncementActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsString()
  @IsIn([
    'publish',
    'unpublish',
    'activate',
    'deactivate',
    'feature',
    'unfeature',
    'pin',
    'unpin',
    'delete',
    'archive',
    'high-priority',
    'urgent-priority',
    'normal-priority',
    'low-priority',
    'enable-comments',
    'disable-comments',
    'enable-notifications',
    'disable-notifications',
  ])
  action: string;
}
