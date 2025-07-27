import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TriviaCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ default: false })
  isPublic: boolean;
}

