import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException } from "@nestjs/common"
import { UserSolutionService } from "../services/user-solution.service"
import { UserSolution } from "../entities/user-solution.entity"
import type { CreateUserSolutionDto } from "../dto/user-solution.dto"
import { jest } from "@jest/globals"

describe("UserSolutionService", () => {
  let service: UserSolutionService
  let repository: Repository<UserSolution>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSolutionService,
        {
          provide: getRepositoryToken(UserSolution),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UserSolutionService>(UserSolutionService)
    repository = module.get<Repository<UserSolution>>(getRepositoryToken(UserSolution))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("recordSolution", () => {
    const createUserSolutionDto: CreateUserSolutionDto = {
      userId: "user-123",
      puzzleId: "puzzle-123",
      isCorrect: true,
      solutionData: { answer: "42" },
    }

    it("should record a new solution successfully", async () => {
      const mockSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
        solutionData: { answer: "42" },
        solvedAt: new Date(),
      }

      mockRepository.findOne.mockResolvedValue(null)
      mockRepository.create.mockReturnValue(mockSolution)
      mockRepository.save.mockResolvedValue(mockSolution)

      const result = await service.recordSolution(createUserSolutionDto)

      expect(result.id).toBe("solution-123")
      expect(result.isCorrect).toBe(true)
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123", puzzleId: "puzzle-123" },
      })
    })

    it("should update existing solution when new one is correct", async () => {
      const existingSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: false,
        solutionData: { answer: "wrong" },
        solvedAt: new Date(),
      }

      const updatedSolution = {
        ...existingSolution,
        isCorrect: true,
        solutionData: { answer: "42" },
      }

      mockRepository.findOne.mockResolvedValue(existingSolution)
      mockRepository.save.mockResolvedValue(updatedSolution)

      const result = await service.recordSolution(createUserSolutionDto)

      expect(result.isCorrect).toBe(true)
      expect(result.solutionData).toEqual({ answer: "42" })
    })

    it("should throw ConflictException when trying to record incorrect solution over correct one", async () => {
      const existingSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
        solutionData: { answer: "42" },
        solvedAt: new Date(),
      }

      const incorrectSolutionDto = {
        ...createUserSolutionDto,
        isCorrect: false,
      }

      mockRepository.findOne.mockResolvedValue(existingSolution)

      await expect(service.recordSolution(incorrectSolutionDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("getUserSolutions", () => {
    it("should return user solutions", async () => {
      const mockSolutions = [
        {
          id: "solution-1",
          userId: "user-123",
          puzzleId: "puzzle-1",
          isCorrect: true,
          solutionData: { answer: "42" },
          solvedAt: new Date(),
        },
        {
          id: "solution-2",
          userId: "user-123",
          puzzleId: "puzzle-2",
          isCorrect: false,
          solutionData: { answer: "wrong" },
          solvedAt: new Date(),
        },
      ]

      mockRepository.find.mockResolvedValue(mockSolutions)

      const result = await service.getUserSolutions("user-123")

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("solution-1")
      expect(result[1].id).toBe("solution-2")
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        order: { solvedAt: "DESC" },
      })
    })
  })

  describe("getPuzzleSolutionStats", () => {
    it("should return puzzle solution statistics", async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // total attempts
        .mockResolvedValueOnce(7) // correct solutions

      const result = await service.getPuzzleSolutionStats("puzzle-123")

      expect(result.totalAttempts).toBe(10)
      expect(result.correctSolutions).toBe(7)
      expect(mockRepository.count).toHaveBeenCalledTimes(2)
    })
  })
})
