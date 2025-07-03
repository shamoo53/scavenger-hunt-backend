import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { ProgressController } from "../progress.controller"
import { ProgressService } from "../progress.service"
import { jest } from "@jest/globals"

describe("ProgressController", () => {
  let controller: ProgressController
  let service: ProgressService

  const mockProgressService = {
    getProgressSummary: jest.fn(),
    startPuzzle: jest.fn(),
    completePuzzle: jest.fn(),
    getUserPuzzleProgress: jest.fn(),
    getAvailablePuzzles: jest.fn(),
    startModule: jest.fn(),
    updateModuleProgress: jest.fn(),
    completeModule: jest.fn(),
    getUserModuleProgress: jest.fn(),
    getUserAchievements: jest.fn(),
    getNextUnlockRequirements: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile()

    controller = module.get<ProgressController>(ProgressController)
    service = module.get<ProgressService>(ProgressService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getProgressSummary", () => {
    it("should return progress summary successfully", async () => {
      const userId = "user1"
      const mockSummary = {
        userId,
        completedPuzzles: [],
        completedModules: [],
        availablePuzzles: [],
        nextUnlockRequirements: [],
        overallProgress: {
          totalPuzzles: 3,
          completedPuzzles: 0,
          totalModules: 2,
          completedModules: 0,
          completionPercentage: 0,
        },
        achievements: [],
      }

      mockProgressService.getProgressSummary.mockResolvedValue(mockSummary)

      const result = await controller.getProgressSummary(userId)

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        message: "Progress summary retrieved successfully",
        timestamp: expect.any(String),
      })
      expect(service.getProgressSummary).toHaveBeenCalledWith(userId)
    })

    it("should throw NotFoundException when service fails", async () => {
      const userId = "user1"
      mockProgressService.getProgressSummary.mockRejectedValue(new Error("Service error"))

      await expect(controller.getProgressSummary(userId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("startPuzzle", () => {
    it("should start puzzle successfully", async () => {
      const userId = "user1"
      const dto = { puzzleId: "puzzle_1" }
      const mockProgress = {
        userId,
        puzzleId: "puzzle_1",
        status: "in_progress",
        startedAt: new Date(),
        attempts: 1,
        hints: [],
      }

      mockProgressService.startPuzzle.mockResolvedValue(mockProgress)

      const result = await controller.startPuzzle(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "Puzzle started successfully",
        timestamp: expect.any(String),
      })
      expect(service.startPuzzle).toHaveBeenCalledWith(userId, dto.puzzleId)
    })

    it("should propagate NotFoundException from service", async () => {
      const userId = "user1"
      const dto = { puzzleId: "non_existent" }

      mockProgressService.startPuzzle.mockRejectedValue(new NotFoundException("Puzzle not found"))

      await expect(controller.startPuzzle(userId, dto)).rejects.toThrow(NotFoundException)
    })

    it("should convert other errors to BadRequestException", async () => {
      const userId = "user1"
      const dto = { puzzleId: "puzzle_1" }

      mockProgressService.startPuzzle.mockRejectedValue(new Error("Generic error"))

      await expect(controller.startPuzzle(userId, dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("completePuzzle", () => {
    it("should complete puzzle successfully", async () => {
      const userId = "user1"
      const dto = { puzzleId: "puzzle_1", score: 85 }
      const mockProgress = {
        userId,
        puzzleId: "puzzle_1",
        status: "completed",
        completedAt: new Date(),
        score: 85,
      }

      mockProgressService.completePuzzle.mockResolvedValue(mockProgress)

      const result = await controller.completePuzzle(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "Puzzle completed successfully",
        timestamp: expect.any(String),
      })
      expect(service.completePuzzle).toHaveBeenCalledWith(userId, dto.puzzleId, dto.score)
    })
  })

  describe("startModule", () => {
    it("should start module successfully", async () => {
      const userId = "user1"
      const dto = { moduleId: "module_1" }
      const mockProgress = {
        userId,
        moduleId: "module_1",
        status: "in_progress",
        startedAt: new Date(),
        progress: 0,
        timeSpent: 0,
      }

      mockProgressService.startModule.mockResolvedValue(mockProgress)

      const result = await controller.startModule(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "Module started successfully",
        timestamp: expect.any(String),
      })
      expect(service.startModule).toHaveBeenCalledWith(userId, dto.moduleId)
    })
  })

  describe("updateModuleProgress", () => {
    it("should update module progress successfully", async () => {
      const userId = "user1"
      const dto = { moduleId: "module_1", progress: 50, timeSpent: 15 }
      const mockProgress = {
        userId,
        moduleId: "module_1",
        status: "in_progress",
        progress: 50,
        timeSpent: 15,
      }

      mockProgressService.updateModuleProgress.mockResolvedValue(mockProgress)

      const result = await controller.updateModuleProgress(userId, dto)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "Module progress updated successfully",
        timestamp: expect.any(String),
      })
      expect(service.updateModuleProgress).toHaveBeenCalledWith(userId, dto.moduleId, dto.progress, dto.timeSpent)
    })
  })

  describe("getUserPuzzleProgress", () => {
    it("should return user puzzle progress", async () => {
      const userId = "user1"
      const mockProgress = [{ userId, puzzleId: "puzzle_1", status: "completed" }]

      mockProgressService.getUserPuzzleProgress.mockResolvedValue(mockProgress)

      const result = await controller.getUserPuzzleProgress(userId)

      expect(result).toEqual({
        success: true,
        data: mockProgress,
        message: "User puzzle progress retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getAvailablePuzzles", () => {
    it("should return available puzzles", async () => {
      const userId = "user1"
      const mockPuzzles = [{ id: "puzzle_1", title: "NFT Basics", difficulty: "easy" }]

      mockProgressService.getAvailablePuzzles.mockResolvedValue(mockPuzzles)

      const result = await controller.getAvailablePuzzles(userId)

      expect(result).toEqual({
        success: true,
        data: mockPuzzles,
        message: "Available puzzles retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getUserAchievements", () => {
    it("should return user achievements", async () => {
      const userId = "user1"
      const mockAchievements = [{ id: "first_puzzle", title: "First Steps", description: "Complete your first puzzle" }]

      mockProgressService.getUserAchievements.mockResolvedValue(mockAchievements)

      const result = await controller.getUserAchievements(userId)

      expect(result).toEqual({
        success: true,
        data: mockAchievements,
        message: "User achievements retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })

  describe("getNextUnlockRequirements", () => {
    it("should return next unlock requirements", async () => {
      const userId = "user1"
      const mockRequirements = [
        {
          puzzleId: "puzzle_2",
          requirements: {
            missingPuzzles: ["puzzle_1"],
            missingModules: ["module_1"],
          },
        },
      ]

      mockProgressService.getNextUnlockRequirements.mockResolvedValue(mockRequirements)

      const result = await controller.getNextUnlockRequirements(userId)

      expect(result).toEqual({
        success: true,
        data: mockRequirements,
        message: "Next unlock requirements retrieved successfully",
        timestamp: expect.any(String),
      })
    })
  })
})
