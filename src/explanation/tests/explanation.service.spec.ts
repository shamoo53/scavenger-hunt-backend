import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common"
import { ExplanationService } from "../services/explanation.service"
import { Explanation } from "../entities/explanation.entity"
import { UserSolution } from "../entities/user-solution.entity"
import type { CreateExplanationDto } from "../dto/create-explanation.dto"
import { jest } from "@jest/globals"

describe("ExplanationService", () => {
  let service: ExplanationService
  let explanationRepository: Repository<Explanation>
  let userSolutionRepository: Repository<UserSolution>

  const mockExplanationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  }

  const mockUserSolutionRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplanationService,
        {
          provide: getRepositoryToken(Explanation),
          useValue: mockExplanationRepository,
        },
        {
          provide: getRepositoryToken(UserSolution),
          useValue: mockUserSolutionRepository,
        },
      ],
    }).compile()

    service = module.get<ExplanationService>(ExplanationService)
    explanationRepository = module.get<Repository<Explanation>>(getRepositoryToken(Explanation))
    userSolutionRepository = module.get<Repository<UserSolution>>(getRepositoryToken(UserSolution))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createExplanation", () => {
    const createExplanationDto: CreateExplanationDto = {
      puzzleId: "puzzle-123",
      text: "This is a detailed explanation of the puzzle solution.",
      createdBy: "admin-123",
    }

    it("should create an explanation successfully", async () => {
      const mockExplanation = {
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "This is a detailed explanation of the puzzle solution.",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockExplanationRepository.findOne.mockResolvedValue(null)
      mockExplanationRepository.create.mockReturnValue(mockExplanation)
      mockExplanationRepository.save.mockResolvedValue(mockExplanation)

      const result = await service.createExplanation(createExplanationDto)

      expect(result.id).toBe("explanation-123")
      expect(result.puzzleId).toBe("puzzle-123")
      expect(result.text).toBe("This is a detailed explanation of the puzzle solution.")
      expect(mockExplanationRepository.findOne).toHaveBeenCalledWith({
        where: { puzzleId: "puzzle-123" },
      })
    })

    it("should throw ConflictException when explanation already exists", async () => {
      const existingExplanation = { id: "existing-explanation" }
      mockExplanationRepository.findOne.mockResolvedValue(existingExplanation)

      await expect(service.createExplanation(createExplanationDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("getExplanationForUser", () => {
    const puzzleId = "puzzle-123"
    const userId = "user-123"

    it("should return explanation when user has solved the puzzle", async () => {
      const mockUserSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
      }

      const mockExplanation = {
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "Detailed explanation",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserSolutionRepository.findOne.mockResolvedValue(mockUserSolution)
      mockExplanationRepository.findOne.mockResolvedValue(mockExplanation)

      const result = await service.getExplanationForUser(puzzleId, userId)

      expect(result.id).toBe("explanation-123")
      expect(result.text).toBe("Detailed explanation")
      expect(mockUserSolutionRepository.findOne).toHaveBeenCalledWith({
        where: { userId, puzzleId, isCorrect: true },
      })
    })

    it("should throw ForbiddenException when user has not solved the puzzle", async () => {
      mockUserSolutionRepository.findOne.mockResolvedValue(null)

      await expect(service.getExplanationForUser(puzzleId, userId)).rejects.toThrow(ForbiddenException)
    })

    it("should throw NotFoundException when explanation does not exist", async () => {
      const mockUserSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
      }

      mockUserSolutionRepository.findOne.mockResolvedValue(mockUserSolution)
      mockExplanationRepository.findOne.mockResolvedValue(null)

      await expect(service.getExplanationForUser(puzzleId, userId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("updateExplanation", () => {
    const puzzleId = "puzzle-123"
    const updateDto = { text: "Updated explanation text" }

    it("should update explanation successfully", async () => {
      const mockExplanation = {
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "Original text",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedExplanation = { ...mockExplanation, text: "Updated explanation text" }

      mockExplanationRepository.findOne.mockResolvedValue(mockExplanation)
      mockExplanationRepository.save.mockResolvedValue(updatedExplanation)

      const result = await service.updateExplanation(puzzleId, updateDto)

      expect(result.text).toBe("Updated explanation text")
      expect(mockExplanationRepository.save).toHaveBeenCalledWith({
        ...mockExplanation,
        text: "Updated explanation text",
      })
    })

    it("should throw NotFoundException when explanation does not exist", async () => {
      mockExplanationRepository.findOne.mockResolvedValue(null)

      await expect(service.updateExplanation(puzzleId, updateDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe("hasUserSolvedPuzzle", () => {
    it("should return true when user has solved puzzle correctly", async () => {
      const mockSolution = {
        id: "solution-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
      }

      mockUserSolutionRepository.findOne.mockResolvedValue(mockSolution)

      const result = await service.hasUserSolvedPuzzle("user-123", "puzzle-123")

      expect(result).toBe(true)
    })

    it("should return false when user has not solved puzzle", async () => {
      mockUserSolutionRepository.findOne.mockResolvedValue(null)

      const result = await service.hasUserSolvedPuzzle("user-123", "puzzle-123")

      expect(result).toBe(false)
    })
  })
})
