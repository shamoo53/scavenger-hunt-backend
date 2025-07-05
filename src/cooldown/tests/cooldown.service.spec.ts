import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { NotFoundException, ForbiddenException } from "@nestjs/common"
import { CooldownService } from "../services/cooldown.service"
import { Cooldown } from "../entities/cooldown.entity"
import { CooldownSettings, CooldownType } from "../entities/cooldown-settings.entity"
import { Puzzle, PuzzleStatus } from "../entities/puzzle.entity"
import type { AttemptPuzzleDto } from "../dto/attempt-puzzle.dto"
import { jest } from "@jest/globals"

describe("CooldownService", () => {
  let service: CooldownService
  let cooldownRepository: Repository<Cooldown>
  let cooldownSettingsRepository: Repository<CooldownSettings>
  let puzzleRepository: Repository<Puzzle>

  const mockCooldownRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockCooldownSettingsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  }

  const mockPuzzleRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooldownService,
        {
          provide: getRepositoryToken(Cooldown),
          useValue: mockCooldownRepository,
        },
        {
          provide: getRepositoryToken(CooldownSettings),
          useValue: mockCooldownSettingsRepository,
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepository,
        },
      ],
    }).compile()

    service = module.get<CooldownService>(CooldownService)
    cooldownRepository = module.get<Repository<Cooldown>>(getRepositoryToken(Cooldown))
    cooldownSettingsRepository = module.get<Repository<CooldownSettings>>(getRepositoryToken(CooldownSettings))
    puzzleRepository = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("checkCooldownStatus", () => {
    const mockPuzzle = {
      id: "puzzle-123",
      title: "Test Puzzle",
      status: PuzzleStatus.PUBLISHED,
    }

    const mockSettings = {
      id: "settings-123",
      puzzleId: null,
      cooldownType: CooldownType.FIXED,
      baseCooldownSeconds: 3600, // 1 hour
      maxCooldownSeconds: null,
      multiplier: 1.0,
      maxAttempts: 0,
      isActive: true,
    }

    it("should return can attempt when no cooldown exists", async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(mockSettings)
      mockCooldownRepository.findOne.mockResolvedValue(null)

      const result = await service.checkCooldownStatus("user-123", "puzzle-123")

      expect(result.canAttempt).toBe(true)
      expect(result.isOnCooldown).toBe(false)
      expect(result.remainingTimeSeconds).toBe(0)
      expect(result.attemptCount).toBe(0)
    })

    it("should return cannot attempt when on cooldown", async () => {
      const futureDate = new Date(Date.now() + 1800000) // 30 minutes from now
      const mockCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: futureDate,
        attemptCount: 1,
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(mockSettings)
      mockCooldownRepository.findOne.mockResolvedValue(mockCooldown)

      const result = await service.checkCooldownStatus("user-123", "puzzle-123")

      expect(result.canAttempt).toBe(false)
      expect(result.isOnCooldown).toBe(true)
      expect(result.remainingTimeSeconds).toBeGreaterThan(0)
      expect(result.attemptCount).toBe(1)
    })

    it("should return cannot attempt when max attempts reached", async () => {
      const settingsWithMaxAttempts = { ...mockSettings, maxAttempts: 3 }
      const mockCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() - 1000), // Expired
        attemptCount: 3,
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(settingsWithMaxAttempts)
      mockCooldownRepository.findOne.mockResolvedValue(mockCooldown)

      const result = await service.checkCooldownStatus("user-123", "puzzle-123")

      expect(result.canAttempt).toBe(false)
      expect(result.remainingTimeSeconds).toBe(Number.POSITIVE_INFINITY)
    })

    it("should throw NotFoundException when puzzle does not exist", async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null)

      await expect(service.checkCooldownStatus("user-123", "puzzle-123")).rejects.toThrow(NotFoundException)
    })

    it("should throw NotFoundException when puzzle is not published", async () => {
      const draftPuzzle = { ...mockPuzzle, status: PuzzleStatus.DRAFT }
      mockPuzzleRepository.findOne.mockResolvedValue(draftPuzzle)

      await expect(service.checkCooldownStatus("user-123", "puzzle-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("attemptPuzzle", () => {
    const attemptDto: AttemptPuzzleDto = {
      userId: "user-123",
      puzzleId: "puzzle-123",
      isCorrect: true,
      solutionData: { answer: "42" },
    }

    const mockPuzzle = {
      id: "puzzle-123",
      status: PuzzleStatus.PUBLISHED,
    }

    const mockSettings = {
      id: "settings-123",
      puzzleId: null,
      cooldownType: CooldownType.FIXED,
      baseCooldownSeconds: 3600,
      maxCooldownSeconds: null,
      multiplier: 1.0,
      maxAttempts: 0,
      isActive: true,
    }

    it("should create new cooldown on first attempt", async () => {
      const mockCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 3600000),
        attemptCount: 1,
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(mockSettings)
      mockCooldownRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null) // For status check and attempt
      mockCooldownRepository.create.mockReturnValue(mockCooldown)
      mockCooldownRepository.save.mockResolvedValue(mockCooldown)
      mockPuzzleRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.attemptPuzzle(attemptDto)

      expect(result.id).toBe("cooldown-123")
      expect(result.attemptCount).toBe(1)
      expect(mockPuzzleRepository.update).toHaveBeenCalledWith("puzzle-123", {
        attemptCount: expect.any(Function),
        solveCount: expect.any(Function),
      })
    })

    it("should update existing cooldown on subsequent attempt", async () => {
      const existingCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(Date.now() - 7200000), // 2 hours ago
        cooldownExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
        attemptCount: 1,
      }

      const updatedCooldown = {
        ...existingCooldown,
        lastAttemptAt: new Date(),
        attemptCount: 2,
        cooldownExpiresAt: new Date(Date.now() + 3600000),
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(mockSettings)
      mockCooldownRepository.findOne.mockResolvedValueOnce(existingCooldown).mockResolvedValueOnce(existingCooldown)
      mockCooldownRepository.save.mockResolvedValue(updatedCooldown)
      mockPuzzleRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.attemptPuzzle(attemptDto)

      expect(result.attemptCount).toBe(2)
    })

    it("should throw ForbiddenException when on cooldown", async () => {
      const activeCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
        attemptCount: 1,
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(mockSettings)
      mockCooldownRepository.findOne.mockResolvedValue(activeCooldown)

      await expect(service.attemptPuzzle(attemptDto)).rejects.toThrow(ForbiddenException)
    })

    it("should throw ForbiddenException when max attempts reached", async () => {
      const settingsWithMaxAttempts = { ...mockSettings, maxAttempts: 2 }
      const maxedCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() - 1000), // Expired
        attemptCount: 2,
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockCooldownSettingsRepository.findOne.mockResolvedValue(settingsWithMaxAttempts)
      mockCooldownRepository.findOne.mockResolvedValue(maxedCooldown)

      await expect(service.attemptPuzzle(attemptDto)).rejects.toThrow(ForbiddenException)
    })
  })

  describe("getUserCooldowns", () => {
    it("should return user cooldowns", async () => {
      const mockCooldowns = [
        {
          id: "cooldown-1",
          userId: "user-123",
          puzzleId: "puzzle-1",
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(),
          attemptCount: 1,
        },
        {
          id: "cooldown-2",
          userId: "user-123",
          puzzleId: "puzzle-2",
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(),
          attemptCount: 2,
        },
      ]

      mockCooldownRepository.find.mockResolvedValue(mockCooldowns)

      const result = await service.getUserCooldowns("user-123")

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("cooldown-1")
      expect(result[1].id).toBe("cooldown-2")
    })
  })

  describe("resetUserCooldown", () => {
    it("should reset user cooldown successfully", async () => {
      const mockCooldown = {
        id: "cooldown-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
      }

      mockCooldownRepository.findOne.mockResolvedValue(mockCooldown)
      mockCooldownRepository.remove.mockResolvedValue(mockCooldown)

      await service.resetUserCooldown("user-123", "puzzle-123")

      expect(mockCooldownRepository.remove).toHaveBeenCalledWith(mockCooldown)
    })

    it("should throw NotFoundException when cooldown not found", async () => {
      mockCooldownRepository.findOne.mockResolvedValue(null)

      await expect(service.resetUserCooldown("user-123", "puzzle-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getCooldownStats", () => {
    it("should return cooldown statistics", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }

      mockCooldownRepository.count.mockResolvedValue(10)
      mockCooldownRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: "8" }) // unique users
        .mockResolvedValueOnce({ count: "6" }) // unique puzzles
        .mockResolvedValueOnce({ average: "2.5" }) // average attempts

      const result = await service.getCooldownStats()

      expect(result.totalCooldowns).toBe(10)
      expect(result.activeCooldowns).toBe(5)
      expect(result.uniqueUsers).toBe(8)
      expect(result.uniquePuzzles).toBe(6)
      expect(result.averageAttempts).toBe(2.5)
    })
  })
})
