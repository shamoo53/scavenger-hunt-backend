import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UnlockType {
  TOKEN = 'token',
  KEY = 'key',
  COMPLETION = 'completion',
  TIME_BASED = 'time_based',
  LEVEL_BASED = 'level_based',
  ACHIEVEMENT = 'achievement'
}

export enum UnlockStatus {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

@Entity('puzzle_unlocks')
@Index(['userId', 'puzzleId'], { unique: true })
@Index(['puzzleId', 'unlockType'])
@Index(['userId', 'status'])
export class Unlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'puzzle_id' })
  @Index()
  puzzleId: string;

  @Column({
    type: 'enum',
    enum: UnlockType,
    name: 'unlock_type'
  })
  unlockType: UnlockType;

  @Column({
    type: 'enum',
    enum: UnlockStatus,
    default: UnlockStatus.LOCKED
  })
  status: UnlockStatus;

  @Column({ name: 'unlock_key', nullable: true })
  unlockKey?: string;

  @Column({ name: 'token_cost', type: 'int', nullable: true })
  tokenCost?: number;

  @Column({ name: 'required_puzzle_id', nullable: true })
  requiredPuzzleId?: string;

  @Column({ name: 'required_level', type: 'int', nullable: true })
  requiredLevel?: number;

  @Column({ name: 'required_achievement', nullable: true })
  requiredAchievement?: string;

  @Column({ name: 'unlock_time', type: 'timestamp', nullable: true })
  unlockTime?: Date;

  @Column({ name: 'expiry_time', type: 'timestamp', nullable: true })
  expiryTime?: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'attempts_used', type: 'int', default: 0 })
  attemptsUsed: number;

  @Column({ name: 'max_attempts', type: 'int', nullable: true })
  maxAttempts?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
