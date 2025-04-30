import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from "typeorm"
import { Game } from "../../games/entities/game.entity"

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  description: string

  @ManyToMany(
    () => Game,
    (game) => game.categories,
  )
  games: Game[]
}
