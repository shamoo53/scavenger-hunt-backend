import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Cooldown } from "../entities/cooldown.entity"
import { type CooldownSettings, CooldownType } from "../entities/cooldown-settings.entity"
import type { Puzzle } from "../entities/puzzle.entity"
import { PuzzleStatus } from "../entities/puzzle.entity"
import { CooldownResponseDto } from "../dto/cooldown-response.dto"
import { CooldownStatusDto } from "../dto/cooldown-status.dto"
import type { AttemptPuzzleDto } from "../dto/attempt-puzzle.dto"

@Injectable()
export class CooldownService {
  private readonly cooldownRepository: Repository<Cooldown>
  private readonly cooldownSettingsRepository: Repository<CooldownSettings>
  private readonly puzzleRepository: Repository<Puzzle>

  constructor(
    cooldownRepository: Repository<Cooldown>,
    cooldownSettingsRepository: Repository<CooldownSettings>,
    puzzleRepository: Repository<Puzzle>,
  ) {
    this.cooldownRepository = cooldownRepository
    this.cooldownSettingsRepository = cooldownSettingsRepository
    this.puzzleRepository = puzzleRepository
  }

  async checkCooldownStatus(userId: string, puzzleId: string): Promise<CooldownStatusDto> {
    // Get puzzle to ensure it exists
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    if (!puzzle) {
      throw new NotFoundException("Puzzle not found")
    }

    if (puzzle.status !== PuzzleStatus.PUBLISHED) {
      throw new NotFoundException("Puzzle is not available")
    }

    // Get cooldown settings for this puzzle or global default
    const settings = await this.getCooldownSettings(puzzleId)

    // Get existing cooldown record
    const cooldown = await this.cooldownRepository.findOne({
      where: { userId, puzzleId },
    })

    const now = new Date()
    let isOnCooldown = false
    let remainingTimeSeconds = 0
    let nextAttemptAt: Date | null = null
    let attemptCount = 0

    if (cooldown) {
      attemptCount = cooldown.attemptCount

      // Check if max attempts reached
      if (settings.maxAttempts > 0 && attemptCount >= settings.maxAttempts) {
        return new CooldownStatusDto({
          isOnCooldown: true,
          remainingTimeSeconds: Number.POSITIVE_INFINITY,
          canAttempt: false,
          nextAttemptAt: null,
          attemptCount,
          maxAttempts: settings.maxAttempts,
          cooldownType: settings.cooldownType,
          baseCooldownSeconds: settings.baseCooldownSeconds,
        })
      }

      // Calculate cooldown expiration
      if (cooldown.cooldownExpiresAt && cooldown.cooldownExpiresAt > now) {
        isOnCooldown = true
        remainingTimeSeconds = Math.ceil((cooldown.cooldownExpiresAt.getTime() - now.getTime()) / 1000)
        nextAttemptAt = cooldown.cooldownExpiresAt
      }
    }

    return new CooldownStatusDto({
      isOnCooldown,
      remainingTimeSeconds,
      canAttempt: !isOnCooldown && (settings.maxAttempts === 0 || attemptCount < settings.maxAttempts),
      nextAttemptAt,
      attemptCount,
      maxAttempts: settings.maxAttempts,
      cooldownType: settings.cooldownType,
      baseCooldownSeconds: settings.baseCooldownSeconds,
    })
  }

  async attemptPuzzle(attemptPuzzleDto: AttemptPuzzleDto): Promise<CooldownResponseDto> {
    const { userId, puzzleId, isCorrect, solutionData } = attemptPuzzleDto

    // Check if user can attempt this puzzle
    const status = await this.checkCooldownStatus(userId, puzzleId)

    if (!status.canAttempt) {
      if (status.remainingTimeSeconds === Number.POSITIVE_INFINITY) {
        throw new ForbiddenException("Maximum attempts reached for this puzzle")
      }
      throw new ForbiddenException(
        `Puzzle is on cooldown. Try again in ${status.remainingTimeFormatted} (${status.remainingTimeSeconds}s)`,
      )
    }

    // Get cooldown settings
    const settings = await this.getCooldownSettings(puzzleId)

    const now = new Date()
    let cooldown = await this.cooldownRepository.findOne({
      where: { userId, puzzleId },
    })

    if (cooldown) {
      // Update existing cooldown
      cooldown.lastAttemptAt = now
      cooldown.attemptCount += 1
      cooldown.cooldownExpiresAt = this.calculateCooldownExpiration(settings, cooldown.attemptCount)
    } else {
      // Create new cooldown
      cooldown = this.cooldownRepository.create({
        userId,
        puzzleId,
        lastAttemptAt: now,
        attemptCount: 1,
        cooldownExpiresAt: this.calculateCooldownExpiration(settings, 1),
      })
    }

    const savedCooldown = await this.cooldownRepository.save(cooldown)

    // Update puzzle attempt count
    await this.puzzleRepository.update(puzzleId, {
      attemptCount: () => "attempt_count + 1",
      ...(isCorrect && { solveCount: () => "solve_count + 1" }),
    })

    return new CooldownResponseDto(savedCooldown)
  }

  async getUserCooldowns(userId: string): Promise<CooldownResponseDto[]> {
    const cooldowns = await this.cooldownRepository.find({
      where: { userId },
      order: { lastAttemptAt: "DESC" },
    })

    return cooldowns.map((cooldown) => new CooldownResponseDto(cooldown))
  }

  async getPuzzleCooldowns(puzzleId: string): Promise<CooldownResponseDto[]> {
    const cooldowns = await this.cooldownRepository.find({
      where: { puzzleId },
      order: { lastAttemptAt: "DESC" },
    })

    return cooldowns.map((cooldown) => new CooldownResponseDto(cooldown))
  }

  async resetUserCooldown(userId: string, puzzleId: string): Promise<void> {
    const cooldown = await this.cooldownRepository.findOne({
      where: { userId, puzzleId },
    })

    if (!cooldown) {
      throw new NotFoundException("Cooldown record not found")
    }

    await this.cooldownRepository.remove(cooldown)
  }

  async resetAllUserCooldowns(userId: string): Promise<number> {
    const result = await this.cooldownRepository.delete({ userId })
    return result.affected || 0
  }

  async getCooldownStats(): Promise<{
    totalCooldowns: number
    activeCooldowns: number
    uniqueUsers: number
    uniquePuzzles: number
    averageAttempts: number
  }> {
    const now = new Date()

    const totalCooldowns = await this.cooldownRepository.count()

    const activeCooldowns = await this.cooldownRepository
      .createQueryBuilder("cooldown")
      .where("cooldown.cooldownExpiresAt > :now", { now })
      .getCount()

    const uniqueUsersResult = await this.cooldownRepository
      .createQueryBuilder("cooldown")
      .select("COUNT(DISTINCT cooldown.userId)", "count")
      .getRawOne()

    const uniquePuzzlesResult = await this.cooldownRepository
      .createQueryBuilder("cooldown")
      .select("COUNT(DISTINCT cooldown.puzzleId)", "count")
      .getRawOne()

    const averageAttemptsResult = await this.cooldownRepository
      .createQueryBuilder("cooldown")
      .select("AVG(cooldown.attemptCount)", "average")
      .getRawOne()

    const uniqueUsers = Number.parseInt(uniqueUsersResult?.count || "0", 10)
    const uniquePuzzles = Number.parseInt(uniquePuzzlesResult?.count || "0", 10)
    const averageAttempts = Number.parseFloat(averageAttemptsResult?.average || "0")

    return {
      totalCooldowns,
      activeCooldowns,
      uniqueUsers,
      uniquePuzzles,
      averageAttempts: Number.parseFloat(averageAttempts.toFixed(2)),
    }
  }

  private async getCooldownSettings(puzzleId: string): Promise<CooldownSettings> {
    // First try to get puzzle-specific settings
    let settings = await this.cooldownSettingsRepository.findOne({
      where: { puzzleId, isActive: true },
    })

    // If no puzzle-specific settings, get global default
    if (!settings) {
      settings = await this.cooldownSettingsRepository.findOne({
        where: { puzzleId: null, isActive: true },
      })
    }

    // If no settings found, create default
    if (!settings) {
      settings = await this.cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 43200, // 12 hours
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })
    }

    return settings
  }

  private calculateCooldownExpiration(settings: CooldownSettings, attemptCount: number): Date {
    const now = new Date()
    let cooldownSeconds = settings.baseCooldownSeconds

    switch (settings.cooldownType) {
      case CooldownType.PROGRESSIVE:
        cooldownSeconds = Math.floor(settings.baseCooldownSeconds * (1 + (attemptCount - 1) * settings.multiplier))
        break

      case CooldownType.EXPONENTIAL:
        cooldownSeconds = Math.floor(settings.baseCooldownSeconds * Math.pow(settings.multiplier, attemptCount - 1))
        break

      case CooldownType.FIXED:
      default:
        cooldownSeconds = settings.baseCooldownSeconds
        break
    }

    // Apply maximum cooldown limit if set
    if (settings.maxCooldownSeconds && cooldownSeconds > settings.maxCooldownSeconds) {
      cooldownSeconds = settings.maxCooldownSeconds
    }

    return new Date(now.getTime() + cooldownSeconds * 1000)
  }

  async canUserAttemptPuzzle(userId: string, puzzleId: string): Promise<boolean> {
    try {
      const status = await this.checkCooldownStatus(userId, puzzleId)
      return status.canAttempt
    } catch {
      return false
    }
  }

  async getRemainingCooldownTime(userId: string, puzzleId: string): Promise<number> {
    try {
      const status = await this.checkCooldownStatus(userId, puzzleId)
      return status.remainingTimeSeconds
    } catch {
      return 0
    }
  }
}
