import { Controller, Post, Get, Param, HttpCode, HttpStatus } from "@nestjs/common"
import type { UserSolutionService } from "../services/user-solution.service"
import type { CreateUserSolutionDto } from "../dto/user-solution.dto"
import type { UserSolutionResponseDto } from "../dto/user-solution.dto"

@Controller("user-solutions")
export class UserSolutionController {
  constructor(private readonly userSolutionService: UserSolutionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordSolution(createUserSolutionDto: CreateUserSolutionDto): Promise<UserSolutionResponseDto> {
    return this.userSolutionService.recordSolution(createUserSolutionDto)
  }

  @Get("user/:userId")
  async getUserSolutions(@Param('userId') userId: string): Promise<UserSolutionResponseDto[]> {
    return this.userSolutionService.getUserSolutions(userId)
  }

  @Get("user/:userId/puzzle/:puzzleId")
  async getUserSolutionForPuzzle(userId: string, puzzleId: string): Promise<UserSolutionResponseDto | null> {
    return this.userSolutionService.getUserSolutionForPuzzle(userId, puzzleId)
  }

  @Get("puzzle/:puzzleId/stats")
  async getPuzzleSolutionStats(@Param('puzzleId') puzzleId: string): Promise<{ totalAttempts: number; correctSolutions: number }> {
    return this.userSolutionService.getPuzzleSolutionStats(puzzleId)
  }
}
