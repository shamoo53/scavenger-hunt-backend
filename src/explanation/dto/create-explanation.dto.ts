import { IsUUID, IsString, MinLength, MaxLength } from "class-validator"

export class CreateExplanationDto {
  @IsUUID()
  puzzleId: string

  @IsString()
  @MinLength(10, { message: "Explanation must be at least 10 characters long" })
  @MaxLength(5000, { message: "Explanation cannot exceed 5000 characters" })
  text: string

  @IsUUID()
  createdBy: string
}
