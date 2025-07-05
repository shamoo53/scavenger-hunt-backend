import { Test, type TestingModule } from "@nestjs/testing"
import { NotificationController } from "../controllers/notification.controller"
import { NotificationService } from "../services/notification.service"
import type { NotificationDto, BroadcastNotificationDto } from "../dto/notification.dto"
import { jest } from "@jest/globals"

describe("NotificationController", () => {
  let controller: NotificationController
  let service: NotificationService

  const mockNotificationService = {
    detectAndNotifyNewPuzzle: jest.fn(),
    broadcastPuzzleNotification: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile()

    controller = module.get<NotificationController>(NotificationController)
    service = module.get<NotificationService>(NotificationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("detectAndNotify", () => {
    const notificationDto: NotificationDto = {
      puzzleId: "puzzle-123",
      puzzleTitle: "Test Puzzle",
      categoryId: "category-123",
    }

    it("should detect and notify successfully", async () => {
      mockNotificationService.detectAndNotifyNewPuzzle.mockResolvedValue(undefined)

      const result = await controller.detectAndNotify(notificationDto)

      expect(result).toEqual({ message: "Notifications sent successfully" })
      expect(mockNotificationService.detectAndNotifyNewPuzzle).toHaveBeenCalledWith(notificationDto)
    })
  })

  describe("broadcastNotification", () => {
    const broadcastDto: BroadcastNotificationDto = {
      puzzleId: "puzzle-123",
      puzzleTitle: "Test Puzzle",
      categoryId: "category-123",
    }

    it("should broadcast notifications successfully", async () => {
      mockNotificationService.broadcastPuzzleNotification.mockResolvedValue(5)

      const result = await controller.broadcastNotification(broadcastDto)

      expect(result).toEqual({
        message: "Broadcast notifications sent successfully",
        count: 5,
      })
      expect(mockNotificationService.broadcastPuzzleNotification).toHaveBeenCalledWith(broadcastDto)
    })

    it("should return zero count when no subscribers", async () => {
      mockNotificationService.broadcastPuzzleNotification.mockResolvedValue(0)

      const result = await controller.broadcastNotification(broadcastDto)

      expect(result).toEqual({
        message: "Broadcast notifications sent successfully",
        count: 0,
      })
    })
  })
})
