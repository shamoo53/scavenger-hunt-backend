import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('abuse_records')
export class AbuseRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ nullable: true })
  questionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('user_abuse_stats')
export class UserAbuseStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: 0 })
  totalAttempts: number;

  @Column({ default: 0 })
  wrongAttempts: number;

  @Column({ default: 0 })
  consecutiveWrongAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptTime: Date;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blockExpiresAt: Date;

  @Column({ default: false })
  flaggedForAdmin: boolean;

  @Column({ type: 'timestamp', nullable: true })
  flaggedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
