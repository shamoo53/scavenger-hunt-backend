import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  CHALLENGE_UPDATE = 'challenge_update',
  NEW_GAME = 'new_game',
  REWARD_EARNED = 'reward_earned',
  SYSTEM_MESSAGE = 'system_message',
  LEADERBOARD_UPDATE = 'leaderboard_update',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: false })
  user: User;

  @Column()
  userId: string;

  // Optional payload for additional data
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;
}
