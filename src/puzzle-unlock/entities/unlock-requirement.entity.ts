import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { UnlockType } from './unlock.entity';

@Entity('unlock_requirements')
@Index(['puzzleId'])
export class UnlockRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'puzzle_id' })
  @Index()
  puzzleId: string;

  @Column({
    type: 'enum',
    enum: UnlockType,
    name: 'unlock_type'
  })
  unlockType: UnlockType;

  @Column({ name: 'is_required', default: true })
  isRequired: boolean;

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

  @Column({ name: 'time_delay_hours', type: 'int', nullable: true })
  timeDelayHours?: number;

  @Column({ name: 'max_attempts', type: 'int', nullable: true })
  maxAttempts?: number;

  @Column({ name: 'expiry_hours', type: 'int', nullable: true })
  expiryHours?: number;

  @Column('jsonb', { nullable: true })
  conditions: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}