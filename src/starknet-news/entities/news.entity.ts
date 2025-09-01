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
  IsUrl,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

@Entity('starknet_news')
@Index(['publishedAt']) // Index for sorting by publication date
@Index(['isPublished']) // Index for filtering published articles
@Index(['category']) // Index for category filtering
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

  @Column({ default: 'general' })
  @IsString()
  @MaxLength(100)
  category: string;

  @Column({ default: true })
  @IsBoolean()
  isPublished: boolean;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
