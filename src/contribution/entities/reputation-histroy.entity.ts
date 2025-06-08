import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Contribution } from './contribution.entity';

@Entity('reputation_history')
export class ReputationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Contribution, { nullable: true })
  @JoinColumn({ name: 'contributionId' })
  contribution: Contribution;

  @Column({ nullable: true })
  contributionId: number;

  @Column()
  pointsChange: number;

  @Column()
  reason: string;

  @Column()
  previousPoints: number;

  @Column()
  newPoints: number;

  @CreateDateColumn()
  createdAt: Date;
}
