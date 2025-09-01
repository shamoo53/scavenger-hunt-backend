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
  IsUrl,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

@Entity('starknet_news')
@Index(['publishedAt']) // Index for sorting by publication date
@Index(['isPublished']) // Index for filtering published articles
@Index(['category']) // Index for category filtering
@Index(['tags']) // Index for tag-based filtering
@Index(['scheduledFor']) // Index for scheduled publication
@Index(['priority']) // Index for priority-based sorting
export class StarknetNews {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MaxLength(255)
  title: string;

  @Column('text')
  @IsString()
  @MaxLength(10000)
  content: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  sourceUrl?: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Column({ default: 'general' })
  @IsString()
  @MaxLength(100)
  category: string;

  @Column({ default: 'normal' })
  @IsString()
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ default: true })
  @IsBoolean()
  isPublished: boolean;

  @Column({ default: false })
  @IsBoolean()
  isFeatured: boolean;

  @Column({ default: false })
  @IsBoolean()
  allowComments: boolean;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  // Engagement tracking
  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  likeCount: number;

  // SEO Metadata
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  // Content metadata
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTimeMinutes?: number;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  additionalMetadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
