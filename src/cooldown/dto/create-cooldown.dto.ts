import { IsUUID } from "class-validator"

export class CreateCooldownDto {
  @IsUUID()
  userId: string

  @IsUUID()
  puzzleId: string
}
