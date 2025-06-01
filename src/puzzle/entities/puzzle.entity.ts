import { Game } from 'src/games/entities/game.entity';
import { User } from 'src/users/users.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Game } from '../../games/entities/game.entity';

export enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum PuzzleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}


@Entity('puzzles')
export class Puzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PuzzleDifficulty,
    default: PuzzleDifficulty.EASY,
  })
  difficulty: PuzzleDifficulty;

    @Column({
    type: 'enum',
    enum: PuzzleStatus,
    default: PuzzleStatus.DRAFT,
  })
  status: PuzzleStatus;

   @ManyToOne(() => User, user => user.puzzles)
  creator: User;

  @Column('tsvector', { nullable: true })
  searchVector: string;

  @Column('jsonb', { nullable: true })
  solution: any;

  @Column('jsonb', { nullable: true })
  hints: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'game_id', nullable: true })
  gameId: string;

  @ManyToOne(() => Game, (game) => game.puzzles)
  game: Game;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
