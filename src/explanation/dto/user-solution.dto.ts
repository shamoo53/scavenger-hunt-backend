import { IsUUID, IsBoolean, IsOptional } from "class-validator"

export class CreateUserSolutionDto {
  @IsUUID()
  userId: string

  @IsUUID()
  puzzleId: string

  @IsBoolean()
  isCorrect: boolean

  @IsOptional()
  solutionData?: any
}

export class UserSolutionResponseDto {
  id: string
  userId: string
  puzzleId: string
  isCorrect: boolean
  solutionData: any
  solvedAt: Date

  constructor(solution: any) {
    this.id = solution.id
    this.userId = solution.userId
    this.puzzleId = solution.puzzleId
    this.isCorrect = solution.isCorrect
    this.solutionData = solution.solutionData
    this.solvedAt = solution.solvedAt
  }
}
