import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('puzzle_timers')
export class PuzzleTimer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', comment: 'The moment the timer starts' })
  startTime: Date;

  @Column({ type: 'timestamptz', comment: 'The moment the timer ends' })
  endTime: Date;

  @Index()
  @Column({ type: 'uuid', comment: 'The associated challenge ID' })
  challengeId: string;
  // Note: In a full-fledged app, this would be a @ManyToOne relationship
  // to a Challenge entity. For standalone purposes, we store the ID.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}