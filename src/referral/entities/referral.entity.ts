import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('referrals')
export class ReferralEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ length: 8, unique: true })
  @Index()
  referralCode: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  referredBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    referralDate?: Date;
  } | null;

  @Column({ type: 'int', default: 0 })
  referralCount: number;
}