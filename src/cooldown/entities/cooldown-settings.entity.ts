import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum CooldownType {
  FIXED = "fixed",
  PROGRESSIVE = "progressive",
  EXPONENTIAL = "exponential",
}

@Entity("puzzle_cooldown_settings")
@Index(["puzzleId"], { unique: true })
export class CooldownSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid", { nullable: true })
  puzzleId: string | null // null means global default

  @Column("enum", { enum: CooldownType, default: CooldownType.FIXED })
  cooldownType: CooldownType

  @Column("integer", { default: 43200 }) // 12 hours in seconds
  baseCooldownSeconds: number

  @Column("integer", { nullable: true })
  maxCooldownSeconds: number | null

  @Column("decimal", { precision: 5, scale: 2, default: 1.0 })
  multiplier: number

  @Column("integer", { default: 0 })
  maxAttempts: number // 0 means unlimited

  @Column("boolean", { default: true })
  isActive: boolean

  @Column("jsonb", { nullable: true })
  metadata: any

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
