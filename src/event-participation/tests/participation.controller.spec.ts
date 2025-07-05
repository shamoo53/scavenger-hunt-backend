import { Test, type TestingModule } from "@nestjs/testing"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { ParticipationController } from "../controllers/participation.controller"
import { ParticipationService } from "../services/participation.service"
import type { CreateParticipationDto } from "../dto/create-participation.dto"
import { ParticipationResponseDto } from "../dto/participation-response.dto"
import { UserEventResponseDto } from "../dto/user-events-response.dto"
import { EventStatus } from "../entities/event.entity"
import { jest } from "@jest/globals"

describe("ParticipationController", () => {
  let controller: ParticipationController
  let service: ParticipationService

  const mockParticipationService = {
    joinEvent: jest.fn(),
    getUserJoinedEvents: jest.fn(),
    getUserParticipationForEvent: jest.fn(),
    getEventParticipants: jest.fn(),
    getEventParticipantCount: jest.fn(),
    leaveEvent: jest.fn(),
    hasUserJoinedEvent: jest.fn(),
    getParticipationStats: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipationController],
      providers: [
        {
          provide: ParticipationService,
          useValue: mockParticipationService,
        },
      ],
    }).compile()

    controller = module.get<ParticipationController>(ParticipationController)
    service = module.get<ParticipationService>(ParticipationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("joinEvent", () => {
    const createParticipationDto: CreateParticipationDto = {
      userId: "user-123",
      eventId: "event-123",
    }

    it("should join event successfully", async () => {
      const expectedResponse = new ParticipationResponseDto({
        id: "participation-123",
        userId: "user-123",
        eventId: "event-123",
        joinedAt: new Date(),
      })

      mockParticipationService.joinEvent.mockResolvedValue(expectedResponse)

      const result = await controller.joinEvent(createParticipationDto)

      expect(result).toEqual(expectedResponse)
      expect(mockParticipationService.joinEvent).toHaveBeenCalledWith(createParticipationDto)
    })

    it("should throw ConflictException when user already joined", async () => {
      mockParticipationService.joinEvent.mockRejectedValue(new ConflictException("User has already joined this event"))

      await expect(controller.joinEvent(createParticipationDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("getUserJoinedEvents", () => {
    it("should return user's joined events", async () => {
      const mockParticipation = {
        id: "participation-123",
        userId: "user-123",
        eventId: "event-123",
        joinedAt: new Date(),
      }

      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        description: "Test Description",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 50,
        metadata: null,
      }

      const expectedEvents = [new UserEventResponseDto(mockParticipation, mockEvent)]

      mockParticipationService.getUserJoinedEvents.mockResolvedValue(expectedEvents)

      const result = await controller.getUserJoinedEvents("user-123")

      expect(result).toEqual(expectedEvents)
      expect(mockParticipationService.getUserJoinedEvents).toHaveBeenCalledWith("user-123")
    })
  })

  describe("getUserParticipationForEvent", () => {
    it("should return user participation for specific event", async () => {
      const expectedResponse = new ParticipationResponseDto({
        id: "participation-123",
        userId: "user-123",
        eventId: "event-123",
        joinedAt: new Date(),
      })

      mockParticipationService.getUserParticipationForEvent.mockResolvedValue(expectedResponse)

      const result = await controller.getUserParticipationForEvent("user-123", "event-123")

      expect(result).toEqual(expectedResponse)
      expect(mockParticipationService.getUserParticipationForEvent).toHaveBeenCalledWith("user-123", "event-123")
    })

    it("should return null when user has not joined event", async () => {
      mockParticipationService.getUserParticipationForEvent.mockResolvedValue(null)

      const result = await controller.getUserParticipationForEvent("user-123", "event-123")

      expect(result).toBeNull()
    })
  })

  describe("getEventParticipantCount", () => {
    it("should return participant count", async () => {
      mockParticipationService.getEventParticipantCount.mockResolvedValue(42)

      const result = await controller.getEventParticipantCount("event-123")

      expect(result).toEqual({ count: 42 })
      expect(mockParticipationService.getEventParticipantCount).toHaveBeenCalledWith("event-123")
    })
  })

  describe("leaveEvent", () => {
    it("should leave event successfully", async () => {
      mockParticipationService.leaveEvent.mockResolvedValue(undefined)

      await controller.leaveEvent("user-123", "event-123")

      expect(mockParticipationService.leaveEvent).toHaveBeenCalledWith("user-123", "event-123")
    })

    it("should throw NotFoundException when user is not participating", async () => {
      mockParticipationService.leaveEvent.mockRejectedValue(
        new NotFoundException("User is not participating in this event"),
      )

      await expect(controller.leaveEvent("user-123", "event-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("checkUserParticipation", () => {
    it("should return true when user has joined event", async () => {
      mockParticipationService.hasUserJoinedEvent.mockResolvedValue(true)

      const result = await controller.checkUserParticipation("user-123", "event-123")

      expect(result).toEqual({ hasJoined: true })
    })

    it("should return false when user has not joined event", async () => {
      mockParticipationService.hasUserJoinedEvent.mockResolvedValue(false)

      const result = await controller.checkUserParticipation("user-123", "event-123")

      expect(result).toEqual({ hasJoined: false })
    })
  })

  describe("getParticipationStats", () => {
    it("should return participation statistics", async () => {
      const expectedStats = {
        totalParticipations: 150,
        activeEventParticipations: 75,
        uniqueParticipants: 100,
      }

      mockParticipationService.getParticipationStats.mockResolvedValue(expectedStats)

      const result = await controller.getParticipationStats()

      expect(result).toEqual(expectedStats)
      expect(mockParticipationService.getParticipationStats).toHaveBeenCalled()
    })
  })
})
