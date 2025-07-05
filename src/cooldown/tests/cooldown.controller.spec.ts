import { Test, type TestingModule } from "@nestjs/testing"
import { ForbiddenException } from "@nestjs/common"
import { CooldownController } from "../controllers/cooldown.controller"
import { CooldownService } from "../services/cooldown.service"
import { CooldownGuard } from "../guards/cooldown.guard"
import type { AttemptPuzzleDto } from "../dto/attempt-puzzle.dto"
import { CooldownResponseDto } from "../dto/cooldown-response.dto"
import { CooldownStatusDto } from "../dto/cooldown-status.dto"
import { CooldownType } from "../entities/cooldown-settings.entity"
import { jest } from "@jest/globals"

describe("CooldownController", () => {
  let controller: CooldownController
  let service: CooldownService

  const mockCooldownService = {
    checkCooldownStatus: jest.fn(),
    attemptPuzzle: jest.fn(),
    getUserCooldowns: jest.fn(),
    getPuzzleCooldowns: jest.fn(),
    resetUserCooldown: jest.fn(),
    resetAllUserCooldowns: jest.fn(),
    getCooldownStats: jest.fn(),
    canUserAttemptPuzzle: jest.fn(),
    getRemainingCooldownTime: jest.fn(),
  }

  const mockCooldownGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CooldownController],
      providers: [
        {
          provide: CooldownService,
          useValue: mockCooldownService,
        },
        {
          provide: CooldownGuard,
          useValue: mockCooldownGuard,
        },
      ],
    }).compile()

    controller = module.get<CooldownController>(CooldownController)
    service = module.get<CooldownService>(CooldownService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getCooldownStatus", () => {
    it("should return cooldown status", async () => {
      const expectedStatus = new CooldownStatusDto({
        isOnCooldown: false,
        remainingTimeSeconds: 0,
        canAttempt: true,
        nextAttemptAt: null,
        attemptCount: 0,
        maxAttempts: 0,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
      })

      mockCooldownService.checkCooldownStatus.mockResolvedValue(expectedStatus)

      const result = await controller.getCooldownStatus("user-123", "puzzle-123")

      expect(result).toEqual(expectedStatus)
      expect(mockCooldownService.checkCooldownStatus).toHaveBeenCalledWith("user-123", "puzzle-123")
    })

    it("should return cooldown status with remaining time", async () => {
      const expectedStatus = new CooldownStatusDto({
        isOnCooldown: true,
        remainingTimeSeconds: 1800,
        canAttempt: false,
        nextAttemptAt: new Date(Date.now() + 1800000),
        attemptCount: 1,
        maxAttempts: 0,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
      })

      mockCooldownService.checkCooldownStatus.mockResolvedValue(expectedStatus)

      const result = await controller.getCooldownStatus("user-123", "puzzle-123")

      expect(result.isOnCooldown).toBe(true)
      expect(result.remainingTimeSeconds).toBe(1800)
      expect(result.remainingTimeFormatted).toBe("30m")
      expect(result.canAttempt).toBe(false)
    })
  })

  describe("attemptPuzzle", () => {
    const attemptDto: AttemptPuzzleDto = {
      userId: "user-123",
      puzzleId: "puzzle-123",
      isCorrect: true,
      solutionData: { answer: "42" },
    }

    it("should attempt puzzle successfully", async () => {
      const expectedResponse = new CooldownResponseDto({
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 3600000),
        attemptCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockCooldownService.attemptPuzzle.mockResolvedValue(expectedResponse)

      const result = await controller.attemptPuzzle(attemptDto)

      expect(result).toEqual(expectedResponse)
      expect(mockCooldownService.attemptPuzzle).toHaveBeenCalledWith(attemptDto)
    })

    it("should throw ForbiddenException when on cooldown", async () => {
      mockCooldownService.attemptPuzzle.mockRejectedValue(
        new ForbiddenException("Puzzle is on cooldown. Try again in 30m"),
      )

      await expect(controller.attemptPuzzle(attemptDto)).rejects.toThrow(ForbiddenException)
    })
  })

  describe("getUserCooldowns", () => {
    it("should return user cooldowns", async () => {
      const expectedCooldowns = [
        new CooldownResponseDto({
          id: "cooldown-1",
          userId: "user-123",
          puzzleId: "puzzle-1",
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(),
          attemptCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]

      mockCooldownService.getUserCooldowns.mockResolvedValue(expectedCooldowns)

      const result = await controller.getUserCooldowns("user-123")

      expect(result).toEqual(expectedCooldowns)
      expect(mockCooldownService.getUserCooldowns).toHaveBeenCalledWith("user-123")
    })
  })

  describe("resetUserCooldown", () => {
    it("should reset user cooldown successfully", async () => {
      mockCooldownService.resetUserCooldown.mockResolvedValue(undefined)

      await controller.resetUserCooldown("user-123", "puzzle-123")

      expect(mockCooldownService.resetUserCooldown).toHaveBeenCalledWith("user-123", "puzzle-123")
    })
  })

  describe("resetAllUserCooldowns", () => {
    it("should reset all user cooldowns", async () => {
      mockCooldownService.resetAllUserCooldowns.mockResolvedValue(5)

      const result = await controller.resetAllUserCooldowns("user-123")

      expect(result).toEqual({ removed: 5 })
      expect(mockCooldownService.resetAllUserCooldowns).toHaveBeenCalledWith("user-123")
    })
  })

  describe("getCooldownStats", () => {
    it("should return cooldown statistics", async () => {
      const expectedStats = {
        totalCooldowns: 100,
        activeCooldowns: 25,
        uniqueUsers: 50,
        uniquePuzzles: 30,
        averageAttempts: 2.5,
      }

      mockCooldownService.getCooldownStats.mockResolvedValue(expectedStats)

      const result = await controller.getCooldownStats()

      expect(result).toEqual(expectedStats)
      expect(mockCooldownService.getCooldownStats).toHaveBeenCalled()
    })
  })

  describe("canUserAttemptPuzzle", () => {
    it("should return true when user can attempt puzzle", async () => {
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(true)

      const result = await controller.canUserAttemptPuzzle("user-123", "puzzle-123")

      expect(result).toEqual({ canAttempt: true })
    })

    it("should return false when user cannot attempt puzzle", async () => {
      mockCooldownService.canUserAttemptPuzzle.mockResolvedValue(false)

      const result = await controller.canUserAttemptPuzzle("user-123", "puzzle-123")

      expect(result).toEqual({ canAttempt: false })
    })
  })

  describe("getRemainingCooldownTime", () => {
    it("should return remaining cooldown time", async () => {
      mockCooldownService.getRemainingCooldownTime.mockResolvedValue(1800)

      const result = await controller.getRemainingCooldownTime("user-123", "puzzle-123")

      expect(result).toEqual({ remainingTimeSeconds: 1800 })
    })

    it("should return 0 when no cooldown", async () => {
      mockCooldownService.getRemainingCooldownTime.mockResolvedValue(0)

      const result = await controller.getRemainingCooldownTime("user-123", "puzzle-123")

      expect(result).toEqual({ remainingTimeSeconds: 0 })
    })
  })
})
