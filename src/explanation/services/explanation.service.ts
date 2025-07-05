import { Injectable, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Explanation } from "../entities/explanation.entity"
import type { UserSolution } from "../entities/user-solution.entity"
import type { CreateExplanationDto } from "../dto/create-explanation.dto"
import type { UpdateExplanationDto } from "../dto/update-explanation.dto"
import { ExplanationResponseDto } from "../dto/explanation-response.dto"

@Injectable()
export class ExplanationService {
  private readonly explanationRepository: Repository<Explanation>
  private readonly userSolutionRepository: Repository<UserSolution>

  constructor(explanationRepository: Repository<Explanation>, userSolutionRepository: Repository<UserSolution>) {
    this.explanationRepository = explanationRepository
    this.userSolutionRepository = userSolutionRepository
  }

  async createExplanation(createExplanationDto: CreateExplanationDto): Promise<ExplanationResponseDto> {
    const { puzzleId, text, createdBy } = createExplanationDto

    // Check if explanation already exists for this puzzle
    const existingExplanation = await this.explanationRepository.findOne({
      where: { puzzleId },
    })

    if (existingExplanation) {
      throw new ConflictException("Explanation already exists for this puzzle")
    }

    const explanation = this.explanationRepository.create({
      puzzleId,
      text,
      createdBy,
    })

    const savedExplanation = await this.explanationRepository.save(explanation)
    return new ExplanationResponseDto(savedExplanation)
  }

  async updateExplanation(
    puzzleId: string,
    updateExplanationDto: UpdateExplanationDto,
  ): Promise<ExplanationResponseDto> {
    const explanation = await this.explanationRepository.findOne({
      where: { puzzleId },
    })

    if (!explanation) {
      throw new NotFoundException("Explanation not found for this puzzle")
    }

    if (updateExplanationDto.text) {
      explanation.text = updateExplanationDto.text
    }

    const updatedExplanation = await this.explanationRepository.save(explanation)
    return new ExplanationResponseDto(updatedExplanation)
  }

  async getExplanationForUser(puzzleId: string, userId: string): Promise<ExplanationResponseDto> {
    // First, check if the user has solved this puzzle correctly
    const userSolution = await this.userSolutionRepository.findOne({
      where: { userId, puzzleId, isCorrect: true },
    })

    if (!userSolution) {
      throw new ForbiddenException("You must solve this puzzle correctly before viewing the explanation")
    }

    // Get the explanation
    const explanation = await this.explanationRepository.findOne({
      where: { puzzleId },
    })

    if (!explanation) {
      throw new NotFoundException("No explanation available for this puzzle")
    }

    return new ExplanationResponseDto(explanation)
  }

  async getExplanationById(explanationId: string): Promise<ExplanationResponseDto> {
    const explanation = await this.explanationRepository.findOne({
      where: { id: explanationId },
    })

    if (!explanation) {
      throw new NotFoundException("Explanation not found")
    }

    return new ExplanationResponseDto(explanation)
  }

  async getAllExplanations(): Promise<ExplanationResponseDto[]> {
    const explanations = await this.explanationRepository.find({
      order: { createdAt: "DESC" },
    })

    return explanations.map((explanation) => new ExplanationResponseDto(explanation))
  }

  async deleteExplanation(puzzleId: string): Promise<void> {
    const explanation = await this.explanationRepository.findOne({
      where: { puzzleId },
    })

    if (!explanation) {
      throw new NotFoundException("Explanation not found for this puzzle")
    }

    await this.explanationRepository.remove(explanation)
  }

  async hasUserSolvedPuzzle(userId: string, puzzleId: string): Promise<boolean> {
    const solution = await this.userSolutionRepository.findOne({
      where: { userId, puzzleId, isCorrect: true },
    })

    return !!solution
  }
}
