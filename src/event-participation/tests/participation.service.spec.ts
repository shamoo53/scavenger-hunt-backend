import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException, NotFoundException, BadRequestException } from "@nestjs/common"
import { ParticipationService } from "../services/participation.service"
import { Participation } from "../entities/participation.entity"
import { Event, EventStatus } from "../entities/event.entity"
import type { CreateParticipationDto } from "../dto/create-participation.dto"
import { jest } from "@jest/globals"

describe("ParticipationService", () => {
  let service: ParticipationService
  let participationRepository: Repository<Participation>
  let eventRepository: Repository<Event>

  const mockParticipationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    findByIds: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockEventRepository = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationService,
        {
          provide: getRepositoryToken(Participation),
          useValue: mockParticipationRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepository,
        },
      ],
    }).compile()

    service = module.get<ParticipationService>(ParticipationService)
    participationRepository = module.get<Repository<Participation>>(getRepositoryToken(Participation))
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("joinEvent", () => {
    const createParticipationDto: CreateParticipationDto = {
      userId: "user-123",
      eventId: "event-123",
    }

    const mockActiveEvent = {
      id: "event-123",
      title: "Test Event",
      status: EventStatus.ACTIVE,
      startDate: new Date(Date.now() - 3600000), // 1 hour ago
      endDate: new Date(Date.now() + 3600000), // 1 hour from now
      maxParticipants: 100,
      currentParticipants: 50,
    }

    it("should allow user to join an active event", async () => {
      const mockParticipation = {
        id: "participation-123",
        userId: "user-123",
        eventId: "event-123",
        joinedAt: new Date(),
      }

      mockEventRepository.findOne.mockResolvedValue(mockActiveEvent)
      mockParticipationRepository.findOne.mockResolvedValue(null)
      mockParticipationRepository.create.mockReturnValue(mockParticipation)
      mockParticipationRepository.save.mockResolvedValue(mockParticipation)
      mockEventRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.joinEvent(createParticipationDto)

      expect(result.id).toBe("participation-123")
      expect(result.userId).toBe("user-123")
      expect(result.eventId).toBe("event-123")
      expect(mockEventRepository.update).toHaveBeenCalledWith("event-123", {
        currentParticipants: 51,
      })
    })

    it("should throw NotFoundException when event does not exist", async () => {
      mockEventRepository.findOne.mockResolvedValue(null)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(NotFoundException)
    })

    it("should throw ConflictException when user has already joined", async () => {
      const existingParticipation = { id: "existing-participation" }

      mockEventRepository.findOne.mockResolvedValue(mockActiveEvent)
      mockParticipationRepository.findOne.mockResolvedValue(existingParticipation)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(ConflictException)
    })

    it("should throw BadRequestException when event is not active", async () => {
      const inactiveEvent = { ...mockActiveEvent, status: EventStatus.ENDED }

      mockEventRepository.findOne.mockResolvedValue(inactiveEvent)
      mockParticipationRepository.findOne.mockResolvedValue(null)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException when event has reached max participants", async () => {
      const fullEvent = { ...mockActiveEvent, currentParticipants: 100 }

      mockEventRepository.findOne.mockResolvedValue(fullEvent)
      mockParticipationRepository.findOne.mockResolvedValue(null)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException when event has not started", async () => {
      const futureEvent = {
        ...mockActiveEvent,
        startDate: new Date(Date.now() + 3600000), // 1 hour from now
      }

      mockEventRepository.findOne.mockResolvedValue(futureEvent)
      mockParticipationRepository.findOne.mockResolvedValue(null)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException when event has ended", async () => {
      const pastEvent = {
        ...mockActiveEvent,
        endDate: new Date(Date.now() - 3600000), // 1 hour ago
      }

      mockEventRepository.findOne.mockResolvedValue(pastEvent)
      mockParticipationRepository.findOne.mockResolvedValue(null)

      await expect(service.joinEvent(createParticipationDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("getUserJoinedEvents", () => {
    it("should return user's joined events with event details", async () => {
      const mockParticipations = [
        {
          id: "participation-1",
          userId: "user-123",
          eventId: "event-1",
          joinedAt: new Date(),
        },
        {
          id: "participation-2",
          userId: "user-123",
          eventId: "event-2",
          joinedAt: new Date(),
        },
      ]

      const mockEvents = [
        {
          id: "event-1",
          title: "Event 1",
          description: "Description 1",
          status: EventStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(),
          maxParticipants: 100,
          currentParticipants: 50,
          metadata: null,
        },
        {
          id: "event-2",
          title: "Event 2",
          description: "Description 2",
          status: EventStatus.ENDED,
          startDate: new Date(),
          endDate: new Date(),
          maxParticipants: 200,
          currentParticipants: 150,
          metadata: { type: "tournament" },
        },
      ]

      mockParticipationRepository.find.mockResolvedValue(mockParticipations)
      mockEventRepository.findByIds.mockResolvedValue(mockEvents)

      const result = await service.getUserJoinedEvents("user-123")

      expect(result).toHaveLength(2)
      expect(result[0].eventTitle).toBe("Event 1")
      expect(result[1].eventTitle).toBe("Event 2")
      expect(result[1].metadata).toEqual({ type: "tournament" })
    })

    it("should return empty array when user has no participations", async () => {
      mockParticipationRepository.find.mockResolvedValue([])

      const result = await service.getUserJoinedEvents("user-123")

      expect(result).toEqual([])
    })
  })

  describe("leaveEvent", () => {
    it("should allow user to leave an event", async () => {
      const mockParticipation = {
        id: "participation-123",
        userId: "user-123",
        eventId: "event-123",
      }

      const mockEvent = {
        id: "event-123",
        currentParticipants: 51,
      }

      mockParticipationRepository.findOne.mockResolvedValue(mockParticipation)
      mockEventRepository.findOne.mockResolvedValue(mockEvent)
      mockParticipationRepository.remove.mockResolvedValue(mockParticipation)
      mockEventRepository.update.mockResolvedValue({ affected: 1 })

      await service.leaveEvent("user-123", "event-123")

      expect(mockParticipationRepository.remove).toHaveBeenCalledWith(mockParticipation)
      expect(mockEventRepository.update).toHaveBeenCalledWith("event-123", {
        currentParticipants: 50,
      })
    })

    it("should throw NotFoundException when user is not participating", async () => {
      mockParticipationRepository.findOne.mockResolvedValue(null)

      await expect(service.leaveEvent("user-123", "event-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("hasUserJoinedEvent", () => {
    it("should return true when user has joined event", async () => {
      const mockParticipation = { id: "participation-123" }
      mockParticipationRepository.findOne.mockResolvedValue(mockParticipation)

      const result = await service.hasUserJoinedEvent("user-123", "event-123")

      expect(result).toBe(true)
    })

    it("should return false when user has not joined event", async () => {
      mockParticipationRepository.findOne.mockResolvedValue(null)

      const result = await service.hasUserJoinedEvent("user-123", "event-123")

      expect(result).toBe(false)
    })
  })

  describe("getEventParticipantCount", () => {
    it("should return participant count for an event", async () => {
      mockParticipationRepository.count.mockResolvedValue(42)

      const result = await service.getEventParticipantCount("event-123")

      expect(result).toBe(42)
      expect(mockParticipationRepository.count).toHaveBeenCalledWith({
        where: { eventId: "event-123" },
      })
    })
  })
})
