import { IsUUID } from "class-validator"

export class CreateBookmarkDto {
  @IsUUID()
  userId: string

  @IsUUID()
  puzzleId: string
}
