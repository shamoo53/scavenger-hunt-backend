import { Controller, Post, Get, Delete, HttpCode, HttpStatus, UseGuards } from "@nestjs/common"
import type { CooldownService } from "../services/cooldown.service"
import type { AttemptPuzzleDto } from "../dto/attempt-puzzle.dto"
import type { CooldownResponseDto } from "../dto/cooldown-response.dto"
import type { CooldownStatusDto } from "../dto/cooldown-status.dto"
import { CooldownGuard, SkipCooldown } from "../guards/cooldown.guard"

@Controller("puzzle-cooldowns")
export class CooldownController {
  constructor(private readonly cooldownService: CooldownService) {}

  @Get("user/:userId/puzzle/:puzzleId/status")
  @SkipCooldown()
  async getCooldownStatus(userId: string, puzzleId: string): Promise<CooldownStatusDto> {
    return this.cooldownService.checkCooldownStatus(userId, puzzleId)
  }

  @Post("attempt")
  @UseGuards(CooldownGuard)
  @HttpCode(HttpStatus.CREATED)
  async attemptPuzzle(attemptPuzzleDto: AttemptPuzzleDto): Promise<CooldownResponseDto> {
    return this.cooldownService.attemptPuzzle(attemptPuzzleDto)
  }

  @Get("user/:userId")
  @SkipCooldown()
  async getUserCooldowns(userId: string): Promise<CooldownResponseDto[]> {
    return this.cooldownService.getUserCooldowns(userId)
  }

  @Get("puzzle/:puzzleId")
  @SkipCooldown()
  async getPuzzleCooldowns(puzzleId: string): Promise<CooldownResponseDto[]> {
    return this.cooldownService.getPuzzleCooldowns(puzzleId)
  }

  @Delete("user/:userId/puzzle/:puzzleId")
  @SkipCooldown()
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetUserCooldown(userId: string, puzzleId: string): Promise<void> {
    return this.cooldownService.resetUserCooldown(userId, puzzleId)
  }

  @Delete("user/:userId/all")
  @SkipCooldown()
  @HttpCode(HttpStatus.OK)
  async resetAllUserCooldowns(userId: string): Promise<{ removed: number }> {
    const removed = await this.cooldownService.resetAllUserCooldowns(userId)
    return { removed }
  }

  @Get("stats")
  @SkipCooldown()
  async getCooldownStats(): Promise<{
    totalCooldowns: number
    activeCooldowns: number
    uniqueUsers: number
    uniquePuzzles: number
    averageAttempts: number
  }> {
    return this.cooldownService.getCooldownStats()
  }

  @Get("user/:userId/puzzle/:puzzleId/can-attempt")
  @SkipCooldown()
  async canUserAttemptPuzzle(userId: string, puzzleId: string): Promise<{ canAttempt: boolean }> {
    const canAttempt = await this.cooldownService.canUserAttemptPuzzle(userId, puzzleId)
    return { canAttempt }
  }

  @Get("user/:userId/puzzle/:puzzleId/remaining-time")
  @SkipCooldown()
  async getRemainingCooldownTime(userId: string, puzzleId: string): Promise<{ remainingTimeSeconds: number }> {
    const remainingTimeSeconds = await this.cooldownService.getRemainingCooldownTime(userId, puzzleId)
    return { remainingTimeSeconds }
  }
}
