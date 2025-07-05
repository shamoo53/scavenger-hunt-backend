import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("event_participations")
@Index(["userId", "eventId"], { unique: true })
export class Participation {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @Column("uuid")
  eventId: string

  @CreateDateColumn()
  joinedAt: Date
}
