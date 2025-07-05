import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("puzzle_cooldowns")
@Index(["userId", "puzzleId"], { unique: true })
export class Cooldown {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @Column("uuid")
  puzzleId: string

  @Column("timestamp with time zone")
  lastAttemptAt: Date

  @Column("timestamp with time zone", { nullable: true })
  cooldownExpiresAt: Date | null

  @Column("integer", { default: 1 })
  attemptCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
