// src/puzzle-difficulty-stats/entities/puzzle-difficulty-stat.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('puzzle_difficulty_stats')
export class PuzzleDifficultyStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, comment: 'The difficulty level' })
  difficultyLevel: string;

  @Column({ type: 'int', default: 0, comment: 'Number of times solved' })
  solveCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}