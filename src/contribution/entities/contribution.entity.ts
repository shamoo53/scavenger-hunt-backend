import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ContributionType, ContributionStatus } from '../enums/contribution-type.enum';

@Entity('contributions')
export class Contribution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ContributionType,
  })
  type: ContributionType;

  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  status: ContributionStatus;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any; // Store additional data like puzzle ID, bug report details, etc.

  @Column({ default: 0 })
  pointsAwarded: number;

  @Column({ nullable: true })
  reviewedBy: number; // Admin who reviewed the contribution

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @ManyToOne(() => User, user => user.contributions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
