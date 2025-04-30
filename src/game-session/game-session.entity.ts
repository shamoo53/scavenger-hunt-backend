import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

export enum GameSessionStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

@Entity("game_sessions")
export class GameSession {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  playerId: string

  @Column({ nullable: true })
  gameId: string

  @Column({
    type: "enum",
    enum: GameSessionStatus,
    default: GameSessionStatus.ACTIVE,
  })
  status: GameSessionStatus

  @Column("jsonb", { default: [] })
  questionIds: number[]

  @Column("jsonb", { default: [] })
  answers: {
    questionId: number
    selectedAnswer: string
    isCorrect: boolean
    timeToAnswerMs: number
  }[]

  @Column({ default: 0 })
  score: number

  @Column({ default: 0 })
  currentQuestionIndex: number

  @Column({ nullable: true })
  startTime: Date

  @Column({ nullable: true })
  endTime: Date

  @Column({ default: 0 })
  totalTimeMs: number

  @Column({ nullable: true })
  region: string

  @Column({ nullable: true })
  platform: string

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
