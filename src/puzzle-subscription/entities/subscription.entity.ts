import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("puzzle_subscriptions")
@Index(["userId", "categoryId"], { unique: true, where: "categoryId IS NOT NULL" })
@Index(["userId", "tagId"], { unique: true, where: "tagId IS NOT NULL" })
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @Column("uuid", { nullable: true })
  categoryId: string | null

  @Column("uuid", { nullable: true })
  tagId: string | null

  @CreateDateColumn()
  createdAt: Date

  // Ensure either categoryId or tagId is set, but not both
  constructor() {
    // This will be enforced at the service level
  }
}
