import { Injectable, ConflictException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { UserSolution } from "../entities/user-solution.entity"
import type { CreateUserSolutionDto } from "../dto/user-solution.dto"
import { UserSolutionResponseDto } from "../dto/user-solution.dto"

@Injectable()
export class UserSolutionService {
  private readonly userSolutionRepository: Repository<UserSolution>

  constructor(userSolutionRepository: Repository<UserSolution>) {
    this.userSolutionRepository = userSolutionRepository
  }

  async recordSolution(createUserSolutionDto: CreateUserSolutionDto): Promise<UserSolutionResponseDto> {
    const { userId, puzzleId, isCorrect, solutionData } = createUserSolutionDto

    // Check if user has already solved this puzzle
    const existingSolution = await this.userSolutionRepository.findOne({
      where: { userId, puzzleId },
    })

    if (existingSolution) {
      // Update existing solution if the new one is correct or if it's an improvement
      if (isCorrect || !existingSolution.isCorrect) {
        existingSolution.isCorrect = isCorrect
        existingSolution.solutionData = solutionData
        const updatedSolution = await this.userSolutionRepository.save(existingSolution)
        return new UserSolutionResponseDto(updatedSolution)
      } else {
        throw new ConflictException("Solution already recorded for this puzzle")
      }
    }

    const solution = this.userSolutionRepository.create({
      userId,
      puzzleId,
      isCorrect,
      solutionData,
    })

    const savedSolution = await this.userSolutionRepository.save(solution)
    return new UserSolutionResponseDto(savedSolution)
  }

  async getUserSolutions(userId: string): Promise<UserSolutionResponseDto[]> {
    const solutions = await this.userSolutionRepository.find({
      where: { userId },
      order: { solvedAt: "DESC" },
    })

    return solutions.map((solution) => new UserSolutionResponseDto(solution))
  }

  async getUserSolutionForPuzzle(userId: string, puzzleId: string): Promise<UserSolutionResponseDto | null> {
    const solution = await this.userSolutionRepository.findOne({
      where: { userId, puzzleId },
    })

    return solution ? new UserSolutionResponseDto(solution) : null
  }

  async getPuzzleSolutionStats(puzzleId: string): Promise<{ totalAttempts: number; correctSolutions: number }> {
    const totalAttempts = await this.userSolutionRepository.count({
      where: { puzzleId },
    })

    const correctSolutions = await this.userSolutionRepository.count({
      where: { puzzleId, isCorrect: true },
    })

    return { totalAttempts, correctSolutions }
  }
}
