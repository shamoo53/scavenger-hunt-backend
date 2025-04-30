import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("leaderboard_entries")
export class LeaderboardEntry {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  playerName: string

  @Column()
  score: number

  @Column({ nullable: true })
  gameId: string

  @Column({ default: false })
  isHighScore: boolean

  @Column({ default: 0 })
  gamesPlayed: number

  @Column({ default: 0 })
  totalPlayTime: number

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @Column({ nullable: true })
  region: string

  @Column({ nullable: true })
  platform: string

  @Column({ nullable: true })
  lastGameDate: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
