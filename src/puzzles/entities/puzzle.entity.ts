import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ default: 10 })
  pointsAwarded: number;
}