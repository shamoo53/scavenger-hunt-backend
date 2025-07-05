import { Test, type TestingModule } from "@nestjs/testing"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { SubscriptionController } from "../controllers/subscription.controller"
import { SubscriptionService } from "../services/subscription.service"
import type { CreateSubscriptionDto } from "../dto/create-subscription.dto"
import { SubscriptionResponseDto } from "../dto/subscription-response.dto"
import { jest } from "@jest/globals"

describe("SubscriptionController", () => {
  let controller: SubscriptionController
  let service: SubscriptionService

  const mockSubscriptionService = {
    createSubscription: jest.fn(),
    getUserSubscriptions: jest.fn(),
    deleteSubscription: jest.fn(),
    getAllSubscriptions: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile()

    controller = module.get<SubscriptionController>(SubscriptionController)
    service = module.get<SubscriptionService>(SubscriptionService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createSubscription", () => {
    const createSubscriptionDto: CreateSubscriptionDto = {
      userId: "user-123",
      categoryId: "category-123",
    }

    it("should create a subscription successfully", async () => {
      const expectedResponse = new SubscriptionResponseDto({
        id: "sub-123",
        userId: "user-123",
        categoryId: "category-123",
        tagId: null,
        createdAt: new Date(),
      })

      mockSubscriptionService.createSubscription.mockResolvedValue(expectedResponse)

      const result = await controller.createSubscription(createSubscriptionDto)

      expect(result).toEqual(expectedResponse)
      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith(createSubscriptionDto)
    })

    it("should throw ConflictException when subscription already exists", async () => {
      mockSubscriptionService.createSubscription.mockRejectedValue(new ConflictException("Subscription already exists"))

      await expect(controller.createSubscription(createSubscriptionDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("getUserSubscriptions", () => {
    it("should return user subscriptions", async () => {
      const expectedSubscriptions = [
        new SubscriptionResponseDto({
          id: "sub-1",
          userId: "user-123",
          categoryId: "category-123",
          tagId: null,
          createdAt: new Date(),
        }),
      ]

      mockSubscriptionService.getUserSubscriptions.mockResolvedValue(expectedSubscriptions)

      const result = await controller.getUserSubscriptions("user-123")

      expect(result).toEqual(expectedSubscriptions)
      expect(mockSubscriptionService.getUserSubscriptions).toHaveBeenCalledWith("user-123")
    })
  })

  describe("deleteSubscription", () => {
    it("should delete subscription successfully", async () => {
      mockSubscriptionService.deleteSubscription.mockResolvedValue(undefined)

      await controller.deleteSubscription("sub-123", "user-123")

      expect(mockSubscriptionService.deleteSubscription).toHaveBeenCalledWith("sub-123", "user-123")
    })

    it("should throw NotFoundException when subscription not found", async () => {
      mockSubscriptionService.deleteSubscription.mockRejectedValue(new NotFoundException("Subscription not found"))

      await expect(controller.deleteSubscription("sub-123", "user-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getAllSubscriptions", () => {
    it("should return all subscriptions", async () => {
      const expectedSubscriptions = [
        new SubscriptionResponseDto({
          id: "sub-1",
          userId: "user-1",
          categoryId: "category-123",
          tagId: null,
          createdAt: new Date(),
        }),
        new SubscriptionResponseDto({
          id: "sub-2",
          userId: "user-2",
          categoryId: null,
          tagId: "tag-123",
          createdAt: new Date(),
        }),
      ]

      mockSubscriptionService.getAllSubscriptions.mockResolvedValue(expectedSubscriptions)

      const result = await controller.getAllSubscriptions()

      expect(result).toEqual(expectedSubscriptions)
      expect(mockSubscriptionService.getAllSubscriptions).toHaveBeenCalled()
    })
  })
})
