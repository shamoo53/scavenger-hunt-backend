export class ParticipationResponseDto {
  id: string
  userId: string
  eventId: string
  joinedAt: Date

  constructor(participation: any) {
    this.id = participation.id
    this.userId = participation.userId
    this.eventId = participation.eventId
    this.joinedAt = participation.joinedAt
  }
}
