import { Puzzle } from "src/puzzle/puzzle.entity";
import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export class Reward {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @Column()
    type: string; // badge, NFT, etc.
  
    @ManyToOne(() => Puzzle, puzzle => puzzle.rewards)
    puzzle: Puzzle;
  
    @Column({ nullable: true })
    assignedUserId?: number;
  }
  