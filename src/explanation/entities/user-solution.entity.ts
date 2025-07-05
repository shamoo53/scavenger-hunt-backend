import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("user_puzzle_solutions")
@Index(["userId", "puzzleId"], { unique: true })
export class UserSolution {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @Column("uuid")
  puzzleId: string

  @Column("boolean", { default: true })
  isCorrect: boolean

  @Column("jsonb", { nullable: true })
  solutionData: any

  @CreateDateColumn()
  solvedAt: Date
}
