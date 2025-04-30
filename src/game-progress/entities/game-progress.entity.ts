import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
  } from 'typeorm';
  import { Game } from '../../games/entities/game.entity';
  import { User } from '../../users/entities/user.entity';
  import { Achievement } from './achievement.entity';
  
  @Entity('game_progress')
  export class GameProgress {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'user_id' })
    userId: number;
  
    @Column({ name: 'game_id' })
    gameId: number;
  
    @Column({ name: 'current_level', default: 1 })
    currentLevel: number;
  
    @Column({ name: 'percentage_completed', type: 'float', default: 0 })
    percentageCompleted: number;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relationships
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @ManyToOne(() => Game)
    @JoinColumn({ name: 'game_id' })
    game: Game;
  
    @OneToMany(() => Achievement, achievement => achievement.gameProgress)
    achievements: Achievement[];
  }