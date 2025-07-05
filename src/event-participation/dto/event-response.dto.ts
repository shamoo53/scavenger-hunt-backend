import type { EventStatus } from "../entities/event.entity"

export class EventResponseDto {
  id: string
  title: string
  description: string | null
  status: EventStatus
  startDate: Date
  endDate: Date
  maxParticipants: number
  currentParticipants: number
  metadata: any
  createdAt: Date
  updatedAt: Date

  constructor(event: any) {
    this.id = event.id
    this.title = event.title
    this.description = event.description
    this.status = event.status
    this.startDate = event.startDate
    this.endDate = event.endDate
    this.maxParticipants = event.maxParticipants
    this.currentParticipants = event.currentParticipants
    this.metadata = event.metadata
    this.createdAt = event.createdAt
    this.updatedAt = event.updatedAt
  }
}
