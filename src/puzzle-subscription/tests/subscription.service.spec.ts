import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException, NotFoundException, BadRequestException } from "@nestjs/common"
import { SubscriptionService } from "../services/subscription.service"
import { Subscription } from "../entities/subscription.entity"
import type { CreateSubscriptionDto } from "../dto/create-subscription.dto"
import { jest } from "@jest/globals"

describe("SubscriptionService", () => {
  let service: SubscriptionService
  let repository: Repository<Subscription>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<SubscriptionService>(SubscriptionService)
    repository = module.get<Repository<Subscription>>(getRepositoryToken(Subscription))
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
      const mockSubscription = {
        id: "sub-123",
        userId: "user-123",
        categoryId: "category-123",
        tagId: null,
        createdAt: new Date(),
      }

      mockRepository.findOne.mockResolvedValue(null)
      mockRepository.create.mockReturnValue(mockSubscription)
      mockRepository.save.mockResolvedValue(mockSubscription)

      const result = await service.createSubscription(createSubscriptionDto)

      expect(result.id).toBe("sub-123")
      expect(result.userId).toBe("user-123")
      expect(result.categoryId).toBe("category-123")
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123", categoryId: "category-123" },
      })
    })

    it("should throw BadRequestException when both categoryId and tagId are provided", async () => {
      const invalidDto = {
        userId: "user-123",
        categoryId: "category-123",
        tagId: "tag-123",
      }

      await expect(service.createSubscription(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException when neither categoryId nor tagId are provided", async () => {
      const invalidDto = {
        userId: "user-123",
      }

      await expect(service.createSubscription(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw ConflictException when subscription already exists", async () => {
      const existingSubscription = { id: "existing-sub" }
      mockRepository.findOne.mockResolvedValue(existingSubscription)

      await expect(service.createSubscription(createSubscriptionDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("getUserSubscriptions", () => {
    it("should return user subscriptions", async () => {
      const mockSubscriptions = [
        {
          id: "sub-1",
          userId: "user-123",
          categoryId: "category-123",
          tagId: null,
          createdAt: new Date(),
        },
        {
          id: "sub-2",
          userId: "user-123",
          categoryId: null,
          tagId: "tag-123",
          createdAt: new Date(),
        },
      ]

      mockRepository.find.mockResolvedValue(mockSubscriptions)

      const result = await service.getUserSubscriptions("user-123")

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("sub-1")
      expect(result[1].id).toBe("sub-2")
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        order: { createdAt: "DESC" },
      })
    })
  })

  describe("deleteSubscription", () => {
    it("should delete subscription successfully", async () => {
      const mockSubscription = {
        id: "sub-123",
        userId: "user-123",
      }

      mockRepository.findOne.mockResolvedValue(mockSubscription)
      mockRepository.remove.mockResolvedValue(mockSubscription)

      await service.deleteSubscription("sub-123", "user-123")

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "sub-123", userId: "user-123" },
      })
      expect(mockRepository.remove).toHaveBeenCalledWith(mockSubscription)
    })

    it("should throw NotFoundException when subscription not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.deleteSubscription("sub-123", "user-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getSubscribersByCategory", () => {
    it("should return subscriber user IDs for a category", async () => {
      const mockSubscriptions = [{ userId: "user-1" }, { userId: "user-2" }]

      mockRepository.find.mockResolvedValue(mockSubscriptions)

      const result = await service.getSubscribersByCategory("category-123")

      expect(result).toEqual(["user-1", "user-2"])
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { categoryId: "category-123" },
        select: ["userId"],
      })
    })
  })

  describe("getSubscribersByTag", () => {
    it("should return subscriber user IDs for a tag", async () => {
      const mockSubscriptions = [{ userId: "user-1" }, { userId: "user-3" }]

      mockRepository.find.mockResolvedValue(mockSubscriptions)

      const result = await service.getSubscribersByTag("tag-123")

      expect(result).toEqual(["user-1", "user-3"])
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tagId: "tag-123" },
        select: ["userId"],
      })
    })
  })
})
