import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

export type QuestionDifficulty = "easy" | "medium" | "hard"
export type QuestionType = "multiple_choice" | "true_false" | "open_ended"

@Entity("questions")
export class Question {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  text: string

  @Column("simple-array")
  options: string[]

  @Column()
  correctAnswer: string

  @Column({
    type: "enum",
    enum: ["easy", "medium", "hard"],
    default: "medium",
  })
  difficulty: QuestionDifficulty

  @Column({
    type: "enum",
    enum: ["multiple_choice", "true_false", "open_ended"],
    default: "multiple_choice",
  })
  type: QuestionType

  @Column({ nullable: true })
  category: string

  @Column({ default: true })
  isActive: boolean

  @Column({ default: 0 })
  timesUsed: number

  @Column({ default: 0 })
  correctAnswers: number

  @Column({ default: 0 })
  incorrectAnswers: number

  @Column({ type: "float", default: 0 })
  averageTimeToAnswer: number

  @Column("simple-array", { nullable: true })
  tags: string[]

  @Column({ default: 0 })
  likes: number

  @Column({ default: 0 })
  dislikes: number

  @Column({ nullable: true })
  authorId: string

  @Column({ nullable: true })
  previousVersionId: number

  @Column({ default: 1 })
  version: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
