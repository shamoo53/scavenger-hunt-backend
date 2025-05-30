import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Puzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}
