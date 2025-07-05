import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { PuzzleSubscriptionModule } from "../puzzle-subscription.module"
import { Subscription } from "../entities/subscription.entity"

describe("PuzzleSubscriptionModule (Integration)", () => {
  let app: INestApplication
  let subscriptionRepository: Repository<Subscription>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Subscription],
          synchronize: true,
        }),
        PuzzleSubscriptionModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    subscriptionRepository = moduleFixture.get<Repository<Subscription>>(getRepositoryToken(Subscription))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await subscriptionRepository.clear()
  })

  describe("/puzzle-subscriptions (POST)", () => {
    it("should create a subscription with categoryId", () => {
      return request(app.getHttpServer())
        .post("/puzzle-subscriptions")
        .send({
          userId: "user-123",
          categoryId: "category-123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.categoryId).toBe("category-123")
          expect(res.body.tagId).toBeNull()
          expect(res.body.id).toBeDefined()
          expect(res.body.createdAt).toBeDefined()
        })
    })

    it("should create a subscription with tagId", () => {
      return request(app.getHttpServer())
        .post("/puzzle-subscriptions")
        .send({
          userId: "user-123",
          tagId: "tag-123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.categoryId).toBeNull()
          expect(res.body.tagId).toBe("tag-123")
        })
    })

    it("should return 400 when both categoryId and tagId are provided", () => {
      return request(app.getHttpServer())
        .post("/puzzle-subscriptions")
        .send({
          userId: "user-123",
          categoryId: "category-123",
          tagId: "tag-123",
        })
        .expect(400)
    })

    it("should return 409 when subscription already exists", async () => {
      // Create first subscription
      await request(app.getHttpServer())
        .post("/puzzle-subscriptions")
        .send({
          userId: "user-123",
          categoryId: "category-123",
        })
        .expect(201)

      // Try to create duplicate
      return request(app.getHttpServer())
        .post("/puzzle-subscriptions")
        .send({
          userId: "user-123",
          categoryId: "category-123",
        })
        .expect(409)
    })
  })

  describe("/puzzle-subscriptions/user/:userId (GET)", () => {
    it("should return user subscriptions", async () => {
      // Create test subscriptions
      await subscriptionRepository.save([
        {
          userId: "user-123",
          categoryId: "category-123",
          tagId: null,
        },
        {
          userId: "user-123",
          categoryId: null,
          tagId: "tag-123",
        },
        {
          userId: "user-456",
          categoryId: "category-456",
          tagId: null,
        },
      ])

      return request(app.getHttpServer())
        .get("/puzzle-subscriptions/user/user-123")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2)
          expect(res.body.every((sub: any) => sub.userId === "user-123")).toBe(true)
        })
    })
  })

  describe("/puzzle-subscriptions/:id (DELETE)", () => {
    it("should delete a subscription", async () => {
      const subscription = await subscriptionRepository.save({
        userId: "user-123",
        categoryId: "category-123",
        tagId: null,
      })

      return request(app.getHttpServer()).delete(`/puzzle-subscriptions/${subscription.id}?userId=user-123`).expect(204)
    })

    it("should return 404 when subscription not found", () => {
      return request(app.getHttpServer()).delete("/puzzle-subscriptions/non-existent-id?userId=user-123").expect(404)
    })
  })

  describe("/puzzle-notifications/detect (POST)", () => {
    it("should detect and notify for category subscriptions", async () => {
      await subscriptionRepository.save({
        userId: "user-123",
        categoryId: "category-123",
        tagId: null,
      })

      return request(app.getHttpServer())
        .post("/puzzle-notifications/detect")
        .send({
          puzzleId: "puzzle-123",
          puzzleTitle: "Test Puzzle",
          categoryId: "category-123",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Notifications sent successfully")
        })
    })
  })

  describe("/puzzle-notifications/broadcast (POST)", () => {
    it("should broadcast notifications and return count", async () => {
      await subscriptionRepository.save([
        {
          userId: "user-1",
          categoryId: "category-123",
          tagId: null,
        },
        {
          userId: "user-2",
          categoryId: "category-123",
          tagId: null,
        },
      ])

      return request(app.getHttpServer())
        .post("/puzzle-notifications/broadcast")
        .send({
          puzzleId: "puzzle-123",
          puzzleTitle: "Test Puzzle",
          categoryId: "category-123",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Broadcast notifications sent successfully")
          expect(res.body.count).toBe(2)
        })
    })
  })
})
