import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

export enum EventStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  ENDED = "ended",
  CANCELLED = "cancelled",
}

@Entity("game_events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("varchar", { length: 255 })
  title: string

  @Column("text", { nullable: true })
  description: string | null

  @Column("enum", { enum: EventStatus, default: EventStatus.UPCOMING })
  status: EventStatus

  @Column("timestamp with time zone")
  startDate: Date

  @Column("timestamp with time zone")
  endDate: Date

  @Column("integer", { default: 0 })
  maxParticipants: number

  @Column("integer", { default: 0 })
  currentParticipants: number

  @Column("jsonb", { nullable: true })
  metadata: any

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
