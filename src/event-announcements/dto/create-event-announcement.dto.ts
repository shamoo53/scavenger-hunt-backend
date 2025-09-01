import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  IsNotEmpty,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';

export class CreateEventAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType = AnnouncementType.GENERAL;

  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority = AnnouncementPriority.NORMAL;

  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus = AnnouncementStatus.DRAFT;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean = true;

  @IsOptional()
  @IsBoolean()
  notifyUsers?: boolean = false;

  // Event-specific fields
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @Type(() => Date)
  publishAt?: Date;

  @IsOptional()
  @Type(() => Date)
  publishedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  scheduledFor?: Date;

  @IsOptional()
  @Type(() => Date)
  expireAt?: Date;

  // Location and event details
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @IsOptional()
  @Type(() => Date)
  eventDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  eventUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  registrationUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  bannerUrl?: string;

  // Targeting and visibility
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  // Competition/Event specific fields
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rules?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prizes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requirements?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxParticipants?: number;

  // Admin metadata
  @IsUUID()
  createdBy: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdByName?: string;

  // Notification settings
  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean = true;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = false;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = false;

  @IsOptional()
  @IsBoolean()
  showInDashboard?: boolean = false;

  @IsOptional()
  @IsBoolean()
  showInApp?: boolean = false;

  // Additional metadata
  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  // SEO fields
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];
}
