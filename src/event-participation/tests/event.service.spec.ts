import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { EventService } from "../services/event.service"
import { Event, EventStatus } from "../entities/event.entity"
import type { CreateEventDto } from "../dto/create-event.dto"
import { jest } from "@jest/globals"

describe("EventService", () => {
  let service: EventService
  let repository: Repository<Event>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<EventService>(EventService)
    repository = module.get<Repository<Event>>(getRepositoryToken(Event))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("createEvent", () => {
    const createEventDto: CreateEventDto = {
      title: "Test Event",
      description: "A test event",
      status: EventStatus.UPCOMING,
      startDate: "2024-12-01T10:00:00Z",
      endDate: "2024-12-01T18:00:00Z",
      maxParticipants: 100,
      metadata: { type: "tournament" },
    }

    it("should create an event successfully", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        description: "A test event",
        status: EventStatus.UPCOMING,
        startDate: new Date("2024-12-01T10:00:00Z"),
        endDate: new Date("2024-12-01T18:00:00Z"),
        maxParticipants: 100,
        currentParticipants: 0,
        metadata: { type: "tournament" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.create.mockReturnValue(mockEvent)
      mockRepository.save.mockResolvedValue(mockEvent)

      const result = await service.createEvent(createEventDto)

      expect(result.id).toBe("event-123")
      expect(result.title).toBe("Test Event")
      expect(result.maxParticipants).toBe(100)
      expect(result.currentParticipants).toBe(0)
    })

    it("should throw BadRequestException when start date is after end date", async () => {
      const invalidDto = {
        ...createEventDto,
        startDate: "2024-12-01T18:00:00Z",
        endDate: "2024-12-01T10:00:00Z",
      }

      await expect(service.createEvent(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should create event with default values when optional fields are missing", async () => {
      const minimalDto = {
        title: "Minimal Event",
        startDate: "2024-12-01T10:00:00Z",
        endDate: "2024-12-01T18:00:00Z",
      }

      const mockEvent = {
        id: "event-123",
        title: "Minimal Event",
        description: null,
        status: EventStatus.UPCOMING,
        startDate: new Date("2024-12-01T10:00:00Z"),
        endDate: new Date("2024-12-01T18:00:00Z"),
        maxParticipants: 0,
        currentParticipants: 0,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.create.mockReturnValue(mockEvent)
      mockRepository.save.mockResolvedValue(mockEvent)

      const result = await service.createEvent(minimalDto)

      expect(result.description).toBeNull()
      expect(result.status).toBe(EventStatus.UPCOMING)
      expect(result.maxParticipants).toBe(0)
    })
  })

  describe("getEventById", () => {
    it("should return event when found", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: EventStatus.ACTIVE,
      }

      mockRepository.findOne.mockResolvedValue(mockEvent)

      const result = await service.getEventById("event-123")

      expect(result.id).toBe("event-123")
      expect(result.title).toBe("Test Event")
    })

    it("should throw NotFoundException when event not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.getEventById("non-existent")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getActiveEvents", () => {
    it("should return active events within time range", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: "event-1",
            title: "Active Event 1",
            status: EventStatus.ACTIVE,
          },
          {
            id: "event-2",
            title: "Active Event 2",
            status: EventStatus.ACTIVE,
          },
        ]),
      }

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)

      const result = await service.getActiveEvents()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe("Active Event 1")
      expect(result[1].title).toBe("Active Event 2")
    })
  })

  describe("updateEventStatus", () => {
    it("should update event status successfully", async () => {
      const mockEvent = {
        id: "event-123",
        title: "Test Event",
        status: EventStatus.UPCOMING,
      }

      const updatedEvent = {
        ...mockEvent,
        status: EventStatus.ACTIVE,
      }

      mockRepository.findOne.mockResolvedValue(mockEvent)
      mockRepository.save.mockResolvedValue(updatedEvent)

      const result = await service.updateEventStatus("event-123", EventStatus.ACTIVE)

      expect(result.status).toBe(EventStatus.ACTIVE)
    })

    it("should throw NotFoundException when event not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.updateEventStatus("non-existent", EventStatus.ACTIVE)).rejects.toThrow(NotFoundException)
    })
  })

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      const mockEvent = { id: "event-123" }

      mockRepository.findOne.mockResolvedValue(mockEvent)
      mockRepository.remove.mockResolvedValue(mockEvent)

      await service.deleteEvent("event-123")

      expect(mockRepository.remove).toHaveBeenCalledWith(mockEvent)
    })

    it("should throw NotFoundException when event not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.deleteEvent("non-existent")).rejects.toThrow(NotFoundException)
    })
  })
})
