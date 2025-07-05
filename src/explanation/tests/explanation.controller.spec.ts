import { Test, type TestingModule } from "@nestjs/testing"
import { ForbiddenException } from "@nestjs/common"
import { ExplanationController } from "../controllers/explanation.controller"
import { ExplanationService } from "../services/explanation.service"
import { AdminGuard } from "../guards/admin.guard"
import type { CreateExplanationDto } from "../dto/create-explanation.dto"
import { ExplanationResponseDto } from "../dto/explanation-response.dto"
import { jest } from "@jest/globals"

describe("ExplanationController", () => {
  let controller: ExplanationController
  let service: ExplanationService

  const mockExplanationService = {
    createExplanation: jest.fn(),
    updateExplanation: jest.fn(),
    getExplanationForUser: jest.fn(),
    getExplanationById: jest.fn(),
    getAllExplanations: jest.fn(),
    deleteExplanation: jest.fn(),
  }

  const mockAdminGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExplanationController],
      providers: [
        {
          provide: ExplanationService,
          useValue: mockExplanationService,
        },
        {
          provide: AdminGuard,
          useValue: mockAdminGuard,
        },
      ],
    }).compile()

    controller = module.get<ExplanationController>(ExplanationController)
    service = module.get<ExplanationService>(ExplanationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getExplanationForUser", () => {
    it("should return explanation when user has solved puzzle", async () => {
      const expectedResponse = new ExplanationResponseDto({
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "Detailed explanation",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockExplanationService.getExplanationForUser.mockResolvedValue(expectedResponse)

      const result = await controller.getExplanationForUser("puzzle-123", "user-123")

      expect(result).toEqual(expectedResponse)
      expect(mockExplanationService.getExplanationForUser).toHaveBeenCalledWith("puzzle-123", "user-123")
    })

    it("should throw ForbiddenException when user has not solved puzzle", async () => {
      mockExplanationService.getExplanationForUser.mockRejectedValue(
        new ForbiddenException("You must solve this puzzle correctly before viewing the explanation"),
      )

      await expect(controller.getExplanationForUser("puzzle-123", "user-123")).rejects.toThrow(ForbiddenException)
    })
  })

  describe("createExplanation", () => {
    const createExplanationDto: CreateExplanationDto = {
      puzzleId: "puzzle-123",
      text: "This is a detailed explanation",
      createdBy: "admin-123",
    }

    it("should create explanation successfully", async () => {
      const expectedResponse = new ExplanationResponseDto({
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "This is a detailed explanation",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockExplanationService.createExplanation.mockResolvedValue(expectedResponse)

      const result = await controller.createExplanation(createExplanationDto)

      expect(result).toEqual(expectedResponse)
      expect(mockExplanationService.createExplanation).toHaveBeenCalledWith(createExplanationDto)
    })
  })

  describe("updateExplanation", () => {
    const updateDto = { text: "Updated explanation text" }

    it("should update explanation successfully", async () => {
      const expectedResponse = new ExplanationResponseDto({
        id: "explanation-123",
        puzzleId: "puzzle-123",
        text: "Updated explanation text",
        createdBy: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockExplanationService.updateExplanation.mockResolvedValue(expectedResponse)

      const result = await controller.updateExplanation("puzzle-123", updateDto)

      expect(result).toEqual(expectedResponse)
      expect(mockExplanationService.updateExplanation).toHaveBeenCalledWith("puzzle-123", updateDto)
    })
  })

  describe("getAllExplanations", () => {
    it("should return all explanations", async () => {
      const expectedExplanations = [
        new ExplanationResponseDto({
          id: "explanation-1",
          puzzleId: "puzzle-1",
          text: "Explanation 1",
          createdBy: "admin-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]

      mockExplanationService.getAllExplanations.mockResolvedValue(expectedExplanations)

      const result = await controller.getAllExplanations()

      expect(result).toEqual(expectedExplanations)
      expect(mockExplanationService.getAllExplanations).toHaveBeenCalled()
    })
  })

  describe("deleteExplanation", () => {
    it("should delete explanation successfully", async () => {
      mockExplanationService.deleteExplanation.mockResolvedValue(undefined)

      await controller.deleteExplanation("puzzle-123")

      expect(mockExplanationService.deleteExplanation).toHaveBeenCalledWith("puzzle-123")
    })
  })
})
