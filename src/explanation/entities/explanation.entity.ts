import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("puzzle_explanations")
@Index(["puzzleId"], { unique: true })
export class Explanation {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  puzzleId: string

  @Column("text")
  text: string

  @Column("uuid")
  createdBy: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
