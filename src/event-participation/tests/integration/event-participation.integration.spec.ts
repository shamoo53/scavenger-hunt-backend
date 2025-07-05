import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { EventParticipationModule } from "../event-participation.module"
import { Participation } from "../entities/participation.entity"
import { Event, EventStatus } from "../entities/event.entity"

describe("EventParticipationModule (Integration)", () => {
  let app: INestApplication
  let participationRepository: Repository<Participation>
  let eventRepository: Repository<Event>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Participation, Event],
          synchronize: true,
        }),
        EventParticipationModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    participationRepository = moduleFixture.get<Repository<Participation>>(getRepositoryToken(Participation))
    eventRepository = moduleFixture.get<Repository<Event>>(getRepositoryToken(Event))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await participationRepository.clear()
    await eventRepository.clear()
  })

  describe("/events (POST)", () => {
    it("should create an event", () => {
      return request(app.getHttpServer())
        .post("/events")
        .send({
          title: "Test Tournament",
          description: "A competitive gaming tournament",
          status: "active",
          startDate: "2024-12-01T10:00:00Z",
          endDate: "2024-12-01T18:00:00Z",
          maxParticipants: 100,
          metadata: { type: "tournament", prize: "$1000" },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe("Test Tournament")
          expect(res.body.status).toBe("active")
          expect(res.body.maxParticipants).toBe(100)
          expect(res.body.currentParticipants).toBe(0)
          expect(res.body.metadata).toEqual({ type: "tournament", prize: "$1000" })
        })
    })

    it("should return 400 when start date is after end date", () => {
      return request(app.getHttpServer())
        .post("/events")
        .send({
          title: "Invalid Event",
          startDate: "2024-12-01T18:00:00Z",
          endDate: "2024-12-01T10:00:00Z",
        })
        .expect(400)
    })
  })

  describe("/events (GET)", () => {
    it("should return all events", async () => {
      await eventRepository.save([
        {
          title: "Event 1",
          description: "First event",
          status: EventStatus.ACTIVE,
          startDate: new Date("2024-12-01T10:00:00Z"),
          endDate: new Date("2024-12-01T18:00:00Z"),
          maxParticipants: 50,
          currentParticipants: 25,
        },
        {
          title: "Event 2",
          description: "Second event",
          status: EventStatus.UPCOMING,
          startDate: new Date("2024-12-02T10:00:00Z"),
          endDate: new Date("2024-12-02T18:00:00Z"),
          maxParticipants: 100,
          currentParticipants: 0,
        },
      ])

      return request(app.getHttpServer())
        .get("/events")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2)
          expect(res.body[0].title).toBe("Event 2") // Ordered by createdAt DESC
          expect(res.body[1].title).toBe("Event 1")
        })
    })
  })

  describe("/event-participation/join (POST)", () => {
    it("should allow user to join an active event", async () => {
      const event = await eventRepository.save({
        title: "Active Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(Date.now() - 3600000), // 1 hour ago
        endDate: new Date(Date.now() + 3600000), // 1 hour from now
        maxParticipants: 100,
        currentParticipants: 0,
      })

      return request(app.getHttpServer())
        .post("/event-participation/join")
        .send({
          userId: "user-123",
          eventId: event.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.eventId).toBe(event.id)
          expect(res.body.joinedAt).toBeDefined()
        })
    })

    it("should return 404 when event does not exist", () => {
      return request(app.getHttpServer())
        .post("/event-participation/join")
        .send({
          userId: "user-123",
          eventId: "non-existent-event",
        })
        .expect(404)
    })

    it("should return 409 when user tries to join same event twice", async () => {
      const event = await eventRepository.save({
        title: "Active Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        maxParticipants: 100,
        currentParticipants: 0,
      })

      // First join
      await request(app.getHttpServer())
        .post("/event-participation/join")
        .send({
          userId: "user-123",
          eventId: event.id,
        })
        .expect(201)

      // Second join attempt
      return request(app.getHttpServer())
        .post("/event-participation/join")
        .send({
          userId: "user-123",
          eventId: event.id,
        })
        .expect(409)
    })

    it("should return 400 when event is not active", async () => {
      const event = await eventRepository.save({
        title: "Ended Event",
        status: EventStatus.ENDED,
        startDate: new Date(Date.now() - 7200000), // 2 hours ago
        endDate: new Date(Date.now() - 3600000), // 1 hour ago
        maxParticipants: 100,
        currentParticipants: 50,
      })

      return request(app.getHttpServer())
        .post("/event-participation/join")
        .send({
          userId: "user-123",
          eventId: event.id,
        })
        .expect(400)
    })
  })

  describe("/event-participation/user/:userId/events (GET)", () => {
    it("should return user's joined events with event details", async () => {
      const event1 = await eventRepository.save({
        title: "Tournament 1",
        description: "First tournament",
        status: EventStatus.ACTIVE,
        startDate: new Date("2024-12-01T10:00:00Z"),
        endDate: new Date("2024-12-01T18:00:00Z"),
        maxParticipants: 50,
        currentParticipants: 25,
        metadata: { type: "tournament" },
      })

      const event2 = await eventRepository.save({
        title: "Tournament 2",
        description: "Second tournament",
        status: EventStatus.ENDED,
        startDate: new Date("2024-11-01T10:00:00Z"),
        endDate: new Date("2024-11-01T18:00:00Z"),
        maxParticipants: 100,
        currentParticipants: 75,
        metadata: { type: "championship" },
      })

      await participationRepository.save([
        {
          userId: "user-123",
          eventId: event1.id,
        },
        {
          userId: "user-123",
          eventId: event2.id,
        },
      ])

      return request(app.getHttpServer())
        .get("/event-participation/user/user-123/events")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2)
          expect(res.body[0].eventTitle).toBe("Tournament 1")
          expect(res.body[0].eventStatus).toBe("active")
          expect(res.body[0].metadata).toEqual({ type: "tournament" })
          expect(res.body[1].eventTitle).toBe("Tournament 2")
          expect(res.body[1].eventStatus).toBe("ended")
          expect(res.body[1].metadata).toEqual({ type: "championship" })
        })
    })

    it("should return empty array when user has no participations", () => {
      return request(app.getHttpServer())
        .get("/event-participation/user/user-456/events")
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([])
        })
    })
  })

  describe("/event-participation/user/:userId/event/:eventId/status (GET)", () => {
    it("should return true when user has joined event", async () => {
      const event = await eventRepository.save({
        title: "Test Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 1,
      })

      await participationRepository.save({
        userId: "user-123",
        eventId: event.id,
      })

      return request(app.getHttpServer())
        .get(`/event-participation/user/user-123/event/${event.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hasJoined).toBe(true)
        })
    })

    it("should return false when user has not joined event", async () => {
      const event = await eventRepository.save({
        title: "Test Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 0,
      })

      return request(app.getHttpServer())
        .get(`/event-participation/user/user-123/event/${event.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hasJoined).toBe(false)
        })
    })
  })

  describe("/event-participation/event/:eventId/count (GET)", () => {
    it("should return participant count for event", async () => {
      const event = await eventRepository.save({
        title: "Test Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 0,
      })

      await participationRepository.save([
        { userId: "user-1", eventId: event.id },
        { userId: "user-2", eventId: event.id },
        { userId: "user-3", eventId: event.id },
      ])

      return request(app.getHttpServer())
        .get(`/event-participation/event/${event.id}/count`)
        .expect(200)
        .expect((res) => {
          expect(res.body.count).toBe(3)
        })
    })
  })

  describe("/event-participation/user/:userId/event/:eventId (DELETE)", () => {
    it("should allow user to leave event", async () => {
      const event = await eventRepository.save({
        title: "Test Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 1,
      })

      await participationRepository.save({
        userId: "user-123",
        eventId: event.id,
      })

      return request(app.getHttpServer()).delete(`/event-participation/user/user-123/event/${event.id}`).expect(204)
    })

    it("should return 404 when user is not participating", async () => {
      const event = await eventRepository.save({
        title: "Test Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 0,
      })

      return request(app.getHttpServer()).delete(`/event-participation/user/user-123/event/${event.id}`).expect(404)
    })
  })

  describe("/event-participation/stats (GET)", () => {
    it("should return participation statistics", async () => {
      const activeEvent = await eventRepository.save({
        title: "Active Event",
        status: EventStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 100,
        currentParticipants: 0,
      })

      const endedEvent = await eventRepository.save({
        title: "Ended Event",
        status: EventStatus.ENDED,
        startDate: new Date(),
        endDate: new Date(),
        maxParticipants: 50,
        currentParticipants: 0,
      })

      await participationRepository.save([
        { userId: "user-1", eventId: activeEvent.id },
        { userId: "user-2", eventId: activeEvent.id },
        { userId: "user-1", eventId: endedEvent.id },
        { userId: "user-3", eventId: endedEvent.id },
      ])

      return request(app.getHttpServer())
        .get("/event-participation/stats")
        .expect(200)
        .expect((res) => {
          expect(res.body.totalParticipations).toBe(4)
          expect(res.body.uniqueParticipants).toBe(3)
        })
    })
  })
})
