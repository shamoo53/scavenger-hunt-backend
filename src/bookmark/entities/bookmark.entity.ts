import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("puzzle_bookmarks")
@Index(["userId", "puzzleId"], { unique: true })
export class Bookmark {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @Column("uuid")
  puzzleId: string

  @CreateDateColumn()
  createdAt: Date
}
