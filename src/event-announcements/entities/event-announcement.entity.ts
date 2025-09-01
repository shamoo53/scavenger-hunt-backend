import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsDateString,
  MaxLength,
  IsArray,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';

@Entity('event_announcements')
@Index(['type']) // Index for filtering by announcement type
@Index(['priority']) // Index for priority-based queries
@Index(['status']) // Index for status filtering
@Index(['isActive']) // Index for active announcements
@Index(['startDate', 'endDate']) // Index for date range queries
@Index(['targetAudience']) // Index for audience targeting
@Index(['createdBy']) // Index for admin queries
export class EventAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MaxLength(255)
  title: string;

  @Column('text')
  @IsString()
  @MaxLength(5000)
  content: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @Column({
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.GENERAL,
  })
  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @Column({
    type: 'enum',
    enum: AnnouncementPriority,
    default: AnnouncementPriority.NORMAL,
  })
  @IsEnum(AnnouncementPriority)
  priority: AnnouncementPriority;

  @Column({
    type: 'enum',
    enum: AnnouncementStatus,
    default: AnnouncementStatus.DRAFT,
  })
  @IsEnum(AnnouncementStatus)
  status: AnnouncementStatus;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ default: false })
  @IsBoolean()
  isPinned: boolean;

  @Column({ default: false })
  @IsBoolean()
  isFeatured: boolean;

  @Column({ default: false })
  @IsBoolean()
  requiresAcknowledgment: boolean;

  @Column({ default: true })
  @IsBoolean()
  isPublished: boolean;

  @Column({ default: true })
  @IsBoolean()
  allowComments: boolean;

  @Column({ default: false })
  @IsBoolean()
  notifyUsers: boolean;

  // Event-specific fields
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  endDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  publishAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  expireAt?: Date;

  // Location and event details
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  eventDate?: Date;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  eventUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  registrationUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  bannerUrl?: string;

  // Targeting and visibility
  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  targetAudience?: string[]; // e.g., ['all', 'new-users', 'premium-users', 'developers']

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  categories?: string[];

  // Competition/Event specific fields
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rules?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prizes?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requirements?: string;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxParticipants?: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  currentParticipants: number;

  // Admin and metadata
  @Column('uuid')
  @IsUUID()
  createdBy: string; // Admin user ID

  @Column('uuid', { nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdByName?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedByName?: string;

  // Engagement tracking
  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  clickCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  acknowledgeCount: number;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  // Notification settings
  @Column({ default: true })
  @IsBoolean()
  sendNotification: boolean;

  @Column({ default: false })
  @IsBoolean()
  sendEmail: boolean;

  @Column({ default: false })
  @IsBoolean()
  sendPush: boolean;

  @Column({ default: false })
  @IsBoolean()
  showInDashboard: boolean;

  @Column({ default: false })
  @IsBoolean()
  showInApp: boolean;

  // Additional metadata
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  // SEO and external sharing
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
