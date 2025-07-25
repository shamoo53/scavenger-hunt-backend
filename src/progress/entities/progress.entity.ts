import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum ProgressStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('progress')
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column()
  @Index()
  puzzleId: string;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.IN_PROGRESS,
  })
  status: ProgressStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', nullable: true })
  timeSpentSeconds: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with User
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Composite unique index to prevent duplicate progress entries
  @Index(['userId', 'puzzleId'], { unique: true })
  userPuzzleIndex: never;
}