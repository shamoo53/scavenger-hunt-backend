// src/starknet-quiz/entities/starknet-quiz.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('starknet_quizzes')
export class StarknetQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', comment: 'The quiz question' })
  question: string;

  @Column({
    type: 'simple-array',
    comment: 'An array of possible answers',
  })
  options: string[];

  @Column({ type: 'varchar', comment: 'The correct answer from the options' })
  correctAnswer: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}