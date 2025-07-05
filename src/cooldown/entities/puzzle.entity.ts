import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

export enum PuzzleDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  EXPERT = "expert",
}

export enum PuzzleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Entity("puzzles")
export class Puzzle {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("varchar", { length: 255 })
  title: string

  @Column("text", { nullable: true })
  description: string | null

  @Column("enum", { enum: PuzzleDifficulty, default: PuzzleDifficulty.MEDIUM })
  difficulty: PuzzleDifficulty

  @Column("enum", { enum: PuzzleStatus, default: PuzzleStatus.DRAFT })
  status: PuzzleStatus

  @Column("uuid", { nullable: true })
  categoryId: string | null

  @Column("simple-array", { nullable: true })
  tags: string[]

  @Column("jsonb", { nullable: true })
  content: any

  @Column("jsonb", { nullable: true })
  solution: any

  @Column("integer", { default: 0 })
  attemptCount: number

  @Column("integer", { default: 0 })
  solveCount: number

  @Column("uuid")
  createdBy: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
