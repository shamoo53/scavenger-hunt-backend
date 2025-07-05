import { IsUUID, IsOptional, IsBoolean } from "class-validator"

export class AttemptPuzzleDto {
  @IsUUID()
  userId: string

  @IsUUID()
  puzzleId: string

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean

  @IsOptional()
  solutionData?: any
}
