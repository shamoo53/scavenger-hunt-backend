import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  IsJSON,
} from 'class-validator';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';

export enum TemplateCategory {
  EVENT = 'event',
  UPDATE = 'update',
  MAINTENANCE = 'maintenance',
  PROMOTION = 'promotion',
  WELCOME = 'welcome',
  NEWSLETTER = 'newsletter',
  URGENT = 'urgent',
  SEASON = 'season',
  ACHIEVEMENT = 'achievement',
  CUSTOM = 'custom',
}

@Entity('announcement_templates')
@Index(['category'])
@Index(['type'])
@Index(['isActive'])
export class AnnouncementTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MaxLength(255)
  name: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
  })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

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

  @Column()
  @IsString()
  @MaxLength(255)
  titleTemplate: string;

  @Column('text')
  @IsString()
  contentTemplate: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  summaryTemplate?: string;

  @Column('json', { nullable: true })
  @IsOptional()
  @IsJSON()
  variables?: Record<
    string,
    {
      type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'email';
      required: boolean;
      defaultValue?: any;
      description?: string;
      placeholder?: string;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        options?: string[];
      };
    }
  >;

  @Column('json', { nullable: true })
  @IsOptional()
  @IsJSON()
  defaultSettings?: {
    isActive?: boolean;
    isPinned?: boolean;
    isFeatured?: boolean;
    requiresAcknowledgment?: boolean;
    allowComments?: boolean;
    notifyUsers?: boolean;
    targetAudience?: string[];
    tags?: string[];
  };

  @Column('json', { nullable: true })
  @IsOptional()
  @IsJSON()
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    iconUrl?: string;
    bannerUrl?: string;
    customCSS?: string;
  };

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ default: false })
  @IsBoolean()
  isSystem: boolean; // System templates cannot be deleted

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;

  @Column({ default: 0 })
  usageCount: number; // Track how many times this template has been used

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
