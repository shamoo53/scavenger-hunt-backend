import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { GameProgress } from './game-progress.entity';
  
  @Entity('achievements')
  export class Achievement {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'game_progress_id' })
    gameProgressId: number;
  
    @Column()
    name: string;
  
    @Column()
    description: string;
  
    @Column({ name: 'unlocked_at' })
    unlockedAt: Date;
  
    // Relationships
    @ManyToOne(() => GameProgress, gameProgress => gameProgress.achievements)
    @JoinColumn({ name: 'game_progress_id' })
    gameProgress: GameProgress;
  }