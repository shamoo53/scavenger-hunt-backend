import { IsUUID } from "class-validator"

export class CreateParticipationDto {
  @IsUUID()
  userId: string

  @IsUUID()
  eventId: string
}
