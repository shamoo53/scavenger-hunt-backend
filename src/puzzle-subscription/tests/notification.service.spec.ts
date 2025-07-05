import { Test, type TestingModule } from "@nestjs/testing"
import { Logger } from "@nestjs/common"
import { NotificationService } from "../services/notification.service"
import { SubscriptionService } from "../services/subscription.service"
import type { NotificationDto, BroadcastNotificationDto } from "../dto/notification.dto"
import jest from "jest"

describe("NotificationService", () => {
  let service: NotificationService
  let subscriptionService: SubscriptionService

  const mockSubscriptionService = {
    getSubscribersByCategory: jest.fn(),
    getSubscribersByTag: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
    subscriptionService = module.get<SubscriptionService>(SubscriptionService)

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, "log").mockImplementation()
    jest.spyOn(Logger.prototype, "warn").mockImplementation()
    jest.spyOn(Logger.prototype, "debug").mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("detectAndNotifyNewPuzzle", () => {
    const notificationDto: NotificationDto = {
      puzzleId: "puzzle-123",
      puzzleTitle: "Test Puzzle",
      categoryId: "category-123",
    }

    it("should notify subscribers for a category", async () => {
      mockSubscriptionService.getSubscribersByCategory.mockResolvedValue(["user-1", "user-2"])

      await service.detectAndNotifyNewPuzzle(notificationDto)

      expect(mockSubscriptionService.getSubscribersByCategory).toHaveBeenCalledWith("category-123")
    })

    it("should notify subscribers for a tag", async () => {
      const tagNotificationDto: NotificationDto = {
        puzzleId: "puzzle-123",
        puzzleTitle: "Test Puzzle",
        tagId: "tag-123",
      }

      mockSubscriptionService.getSubscribersByTag.mockResolvedValue(["user-3", "user-4"])

      await service.detectAndNotifyNewPuzzle(tagNotificationDto)

      expect(mockSubscriptionService.getSubscribersByTag).toHaveBeenCalledWith("tag-123")
    })

    it("should notify unique subscribers for both category and tag", async () => {
      const bothNotificationDto: NotificationDto = {
        puzzleId: "puzzle-123",
        puzzleTitle: "Test Puzzle",
        categoryId: "category-123",
        tagId: "tag-123",
      }

      mockSubscriptionService.getSubscribersByCategory.mockResolvedValue(["user-1", "user-2"])
      mockSubscriptionService.getSubscribersByTag.mockResolvedValue(["user-2", "user-3"])

      await service.detectAndNotifyNewPuzzle(bothNotificationDto)

      expect(mockSubscriptionService.getSubscribersByCategory).toHaveBeenCalledWith("category-123")
      expect(mockSubscriptionService.getSubscribersByTag).toHaveBeenCalledWith("tag-123")
    })

    it("should warn when no category or tag is specified", async () => {
      const emptyNotificationDto: NotificationDto = {
        puzzleId: "puzzle-123",
        puzzleTitle: "Test Puzzle",
      }

      const warnSpy = jest.spyOn(Logger.prototype, "warn")

      await service.detectAndNotifyNewPuzzle(emptyNotificationDto)

      expect(warnSpy).toHaveBeenCalledWith("No category or tag specified for puzzle puzzle-123")
    })
  })

  describe("broadcastPuzzleNotification", () => {
    const broadcastDto: BroadcastNotificationDto = {
      puzzleId: "puzzle-123",
      puzzleTitle: "Test Puzzle",
      categoryId: "category-123",
    }

    it("should broadcast notifications and return count", async () => {
      mockSubscriptionService.getSubscribersByCategory.mockResolvedValue(["user-1", "user-2", "user-3"])

      const result = await service.broadcastPuzzleNotification(broadcastDto)

      expect(result).toBe(3)
      expect(mockSubscriptionService.getSubscribersByCategory).toHaveBeenCalledWith("category-123")
    })

    it("should return 0 when no category or tag is specified", async () => {
      const emptyBroadcastDto: BroadcastNotificationDto = {
        puzzleId: "puzzle-123",
        puzzleTitle: "Test Puzzle",
      }

      const result = await service.broadcastPuzzleNotification(emptyBroadcastDto)

      expect(result).toBe(0)
    })

    it("should handle unique subscribers from both category and tag", async () => {
      const bothBroadcastDto: BroadcastNotificationDto = {
        puzzleId: "puzzle-123",
        puzzleTitle: "Test Puzzle",
        categoryId: "category-123",
        tagId: "tag-123",
      }

      mockSubscriptionService.getSubscribersByCategory.mockResolvedValue(["user-1", "user-2"])
      mockSubscriptionService.getSubscribersByTag.mockResolvedValue(["user-2", "user-3", "user-4"])

      const result = await service.broadcastPuzzleNotification(bothBroadcastDto)

      expect(result).toBe(4) // unique users: user-1, user-2, user-3, user-4
    })
  })

  describe("getNotificationHistory", () => {
    it("should return empty array for notification history", async () => {
      const result = await service.getNotificationHistory()
      expect(result).toEqual([])
    })
  })
})
