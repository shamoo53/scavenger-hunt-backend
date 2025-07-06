import { Reward } from "src/reward/reward.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";



@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('json')
  data: any; 

  @OneToMany(() => Reward, reward => reward.puzzle)
  rewards: Reward[];
}