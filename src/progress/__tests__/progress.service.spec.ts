import { Test, type TestingModule } from "@nestjs/testing"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { ProgressService } from "../progress.service"

describe("ProgressService", () => {
  let service: ProgressService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressService],
    }).compile()

    service = module.get<ProgressService>(ProgressService)
  })

  describe("startPuzzle", () => {
    it("should start a puzzle successfully", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_1"

      const result = await service.startPuzzle(userId, puzzleId)

      expect(result).toEqual({
        userId,
        puzzleId,
        status: "in_progress",
        startedAt: expect.any(Date),
        attempts: 1,
        hints: [],
      })
    })

    it("should throw NotFoundException for non-existent puzzle", async () => {
      const userId = "user1"
      const puzzleId = "non_existent"

      await expect(service.startPuzzle(userId, puzzleId)).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException for locked puzzle", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_2" // Requires puzzle_1 to be completed

      await expect(service.startPuzzle(userId, puzzleId)).rejects.toThrow(BadRequestException)
    })

    it("should increment attempts for existing progress", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_1"

      // Start puzzle first time
      await service.startPuzzle(userId, puzzleId)

      // Start puzzle second time
      const result = await service.startPuzzle(userId, puzzleId)

      expect(result.attempts).toBe(2)
    })
  })

  describe("completePuzzle", () => {
    it("should complete a puzzle successfully", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_1"
      const score = 85

      // Start puzzle first
      await service.startPuzzle(userId, puzzleId)

      // Complete puzzle
      const result = await service.completePuzzle(userId, puzzleId, score)

      expect(result).toEqual({
        userId,
        puzzleId,
        status: "completed",
        startedAt: expect.any(Date),
        completedAt: expect.any(Date),
        attempts: 1,
        hints: [],
        score,
      })
    })

    it("should throw NotFoundException for non-existent progress", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_1"

      await expect(service.completePuzzle(userId, puzzleId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("startModule", () => {
    it("should start a module successfully", async () => {
      const userId = "user1"
      const moduleId = "module_1"

      const result = await service.startModule(userId, moduleId)

      expect(result).toEqual({
        userId,
        moduleId,
        status: "in_progress",
        startedAt: expect.any(Date),
        progress: 0,
        timeSpent: 0,
      })
    })

    it("should throw NotFoundException for non-existent module", async () => {
      const userId = "user1"
      const moduleId = "non_existent"

      await expect(service.startModule(userId, moduleId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("updateModuleProgress", () => {
    it("should update module progress successfully", async () => {
      const userId = "user1"
      const moduleId = "module_1"
      const progress = 50
      const timeSpent = 15

      // Start module first
      await service.startModule(userId, moduleId)

      // Update progress
      const result = await service.updateModuleProgress(userId, moduleId, progress, timeSpent)

      expect(result.progress).toBe(50)
      expect(result.timeSpent).toBe(15)
      expect(result.status).toBe("in_progress")
    })

    it("should complete module when progress reaches 100", async () => {
      const userId = "user1"
      const moduleId = "module_1"

      // Start module first
      await service.startModule(userId, moduleId)

      // Complete module
      const result = await service.updateModuleProgress(userId, moduleId, 100, 30)

      expect(result.progress).toBe(100)
      expect(result.status).toBe("completed")
      expect(result.completedAt).toBeDefined()
    })

    it("should throw NotFoundException for non-existent progress", async () => {
      const userId = "user1"
      const moduleId = "module_1"

      await expect(service.updateModuleProgress(userId, moduleId, 50, 15)).rejects.toThrow(NotFoundException)
    })
  })

  describe("isPuzzleUnlocked", () => {
    it("should return true for puzzle with no prerequisites", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_1"

      const result = await service.isPuzzleUnlocked(userId, puzzleId)

      expect(result).toBe(true)
    })

    it("should return false for puzzle with unmet prerequisites", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_2" // Requires puzzle_1 and module_1

      const result = await service.isPuzzleUnlocked(userId, puzzleId)

      expect(result).toBe(false)
    })

    it("should return true for puzzle with met prerequisites", async () => {
      const userId = "user1"
      const puzzleId = "puzzle_2"

      // Complete prerequisites
      await service.startPuzzle(userId, "puzzle_1")
      await service.completePuzzle(userId, "puzzle_1")
      await service.startModule(userId, "module_1")
      await service.completeModule(userId, "module_1")

      const result = await service.isPuzzleUnlocked(userId, puzzleId)

      expect(result).toBe(true)
    })
  })

  describe("getProgressSummary", () => {
    it("should return comprehensive progress summary", async () => {
      const userId = "user1"

      // Complete some puzzles and modules
      await service.startPuzzle(userId, "puzzle_1")
      await service.completePuzzle(userId, "puzzle_1", 90)
      await service.startModule(userId, "module_1")
      await service.completeModule(userId, "module_1")

      const result = await service.getProgressSummary(userId)

      expect(result).toEqual({
        userId,
        completedPuzzles: expect.arrayContaining([
          expect.objectContaining({
            puzzleId: "puzzle_1",
            status: "completed",
            score: 90,
          }),
        ]),
        completedModules: expect.arrayContaining([
          expect.objectContaining({
            moduleId: "module_1",
            status: "completed",
          }),
        ]),
        availablePuzzles: expect.any(Array),
        nextUnlockRequirements: expect.any(Array),
        overallProgress: {
          totalPuzzles: 3,
          completedPuzzles: 1,
          totalModules: 2,
          completedModules: 1,
          completionPercentage: 40,
        },
        achievements: expect.any(Array),
      })
    })
  })

  describe("checkAndUnlockAchievements", () => {
    it("should unlock first puzzle achievement", async () => {
      const userId = "user1"

      // Complete first puzzle
      await service.startPuzzle(userId, "puzzle_1")
      await service.completePuzzle(userId, "puzzle_1")

      const achievements = await service.checkAndUnlockAchievements(userId)

      expect(achievements).toContainEqual(
        expect.objectContaining({
          id: "first_puzzle",
          title: "First Steps",
          description: "Complete your first puzzle",
        }),
      )
    })

    it("should unlock first module achievement", async () => {
      const userId = "user1"

      // Complete first module
      await service.startModule(userId, "module_1")
      await service.completeModule(userId, "module_1")

      const achievements = await service.checkAndUnlockAchievements(userId)

      expect(achievements).toContainEqual(
        expect.objectContaining({
          id: "first_module",
          title: "Knowledge Seeker",
          description: "Complete your first educational module",
        }),
      )
    })
  })

  describe("getAvailablePuzzles", () => {
    it("should return only unlocked puzzles", async () => {
      const userId = "user1"

      const result = await service.getAvailablePuzzles(userId)

      // Only puzzle_1 should be available initially
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("puzzle_1")
    })

    it("should return more puzzles as prerequisites are met", async () => {
      const userId = "user1"

      // Complete prerequisites for puzzle_2
      await service.startPuzzle(userId, "puzzle_1")
      await service.completePuzzle(userId, "puzzle_1")
      await service.startModule(userId, "module_1")
      await service.completeModule(userId, "module_1")

      const result = await service.getAvailablePuzzles(userId)

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toContain("puzzle_2")
    })
  })
})
