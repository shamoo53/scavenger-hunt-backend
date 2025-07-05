import type { EventStatus } from "../entities/event.entity"

export class UserEventResponseDto {
  id: string
  eventId: string
  eventTitle: string
  eventDescription: string | null
  eventStatus: EventStatus
  eventStartDate: Date
  eventEndDate: Date
  joinedAt: Date
  maxParticipants: number
  currentParticipants: number
  metadata: any

  constructor(participation: any, event: any) {
    this.id = participation.id
    this.eventId = participation.eventId
    this.eventTitle = event.title
    this.eventDescription = event.description
    this.eventStatus = event.status
    this.eventStartDate = event.startDate
    this.eventEndDate = event.endDate
    this.joinedAt = participation.joinedAt
    this.maxParticipants = event.maxParticipants
    this.currentParticipants = event.currentParticipants
    this.metadata = event.metadata
  }
}
