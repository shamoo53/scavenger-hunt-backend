import { Controller, NotFoundException, BadRequestException } from "@nestjs/common"
import type { ProgressService } from "./progress.service"
import { ResponseUtil } from "../utils/response.util"

export interface StartPuzzleDto {
  puzzleId: string
}

export interface CompletePuzzleDto {
  puzzleId: string
  score?: number
}

export interface UpdateModuleProgressDto {
  moduleId: string
  progress: number
  timeSpent: number
}

@Controller("users")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // Main endpoint: Get user progress summary
  async getProgressSummary(userId: string) {
    try {
      const summary = await this.progressService.getProgressSummary(userId)
      return ResponseUtil.success(summary, "Progress summary retrieved successfully")
    } catch (error) {
      throw new NotFoundException(`Unable to retrieve progress for user ${userId}`)
    }
  }

  // Puzzle endpoints
  async startPuzzle(userId: string, dto: StartPuzzleDto) {
    try {
      const progress = await this.progressService.startPuzzle(userId, dto.puzzleId)
      return ResponseUtil.success(progress, "Puzzle started successfully")
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException("Failed to start puzzle")
    }
  }

  async completePuzzle(userId: string, dto: CompletePuzzleDto) {
    try {
      const progress = await this.progressService.completePuzzle(userId, dto.puzzleId, dto.score)
      return ResponseUtil.success(progress, "Puzzle completed successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to complete puzzle")
    }
  }

  async getUserPuzzleProgress(userId: string) {
    const progress = await this.progressService.getUserPuzzleProgress(userId)
    return ResponseUtil.success(progress, "User puzzle progress retrieved successfully")
  }

  async getAvailablePuzzles(userId: string) {
    const puzzles = await this.progressService.getAvailablePuzzles(userId)
    return ResponseUtil.success(puzzles, "Available puzzles retrieved successfully")
  }

  // Module endpoints
  async startModule(userId: string, dto: { moduleId: string }) {
    try {
      const progress = await this.progressService.startModule(userId, dto.moduleId)
      return ResponseUtil.success(progress, "Module started successfully")
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException("Failed to start module")
    }
  }

  async updateModuleProgress(userId: string, dto: UpdateModuleProgressDto) {
    try {
      const progress = await this.progressService.updateModuleProgress(
        userId,
        dto.moduleId,
        dto.progress,
        dto.timeSpent,
      )
      return ResponseUtil.success(progress, "Module progress updated successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to update module progress")
    }
  }

  async completeModule(userId: string, dto: { moduleId: string }) {
    try {
      const progress = await this.progressService.completeModule(userId, dto.moduleId)
      return ResponseUtil.success(progress, "Module completed successfully")
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Failed to complete module")
    }
  }

  async getUserModuleProgress(userId: string) {
    const progress = await this.progressService.getUserModuleProgress(userId)
    return ResponseUtil.success(progress, "User module progress retrieved successfully")
  }

  // Achievement endpoints
  async getUserAchievements(userId: string) {
    const achievements = await this.progressService.getUserAchievements(userId)
    return ResponseUtil.success(achievements, "User achievements retrieved successfully")
  }

  // Unlock requirements
  async getNextUnlockRequirements(userId: string) {
    const requirements = await this.progressService.getNextUnlockRequirements(userId)
    return ResponseUtil.success(requirements, "Next unlock requirements retrieved successfully")
  }
}
