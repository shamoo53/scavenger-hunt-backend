import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { PuzzleExplanationModule } from "../puzzle-explanation.module"
import { Explanation } from "../entities/explanation.entity"
import { UserSolution } from "../entities/user-solution.entity"

describe("PuzzleExplanationModule (Integration)", () => {
  let app: INestApplication
  let explanationRepository: Repository<Explanation>
  let userSolutionRepository: Repository<UserSolution>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Explanation, UserSolution],
          synchronize: true,
        }),
        PuzzleExplanationModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    explanationRepository = moduleFixture.get<Repository<Explanation>>(getRepositoryToken(Explanation))
    userSolutionRepository = moduleFixture.get<Repository<UserSolution>>(getRepositoryToken(UserSolution))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await explanationRepository.clear()
    await userSolutionRepository.clear()
  })

  describe("/puzzle-explanations (POST) - Admin Only", () => {
    it("should create explanation with admin headers", () => {
      return request(app.getHttpServer())
        .post("/puzzle-explanations")
        .set("x-user-id", "admin-123")
        .set("x-user-role", "admin")
        .send({
          puzzleId: "puzzle-123",
          text: "This is a detailed explanation of how to solve this puzzle step by step.",
          createdBy: "admin-123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.puzzleId).toBe("puzzle-123")
          expect(res.body.text).toBe("This is a detailed explanation of how to solve this puzzle step by step.")
          expect(res.body.createdBy).toBe("admin-123")
          expect(res.body.id).toBeDefined()
        })
    })

    it("should return 403 without admin headers", () => {
      return request(app.getHttpServer())
        .post("/puzzle-explanations")
        .send({
          puzzleId: "puzzle-123",
          text: "This is a detailed explanation",
          createdBy: "user-123",
        })
        .expect(403)
    })

    it("should return 409 when explanation already exists", async () => {
      await explanationRepository.save({
        puzzleId: "puzzle-123",
        text: "Existing explanation",
        createdBy: "admin-123",
      })

      return request(app.getHttpServer())
        .post("/puzzle-explanations")
        .set("x-user-id", "admin-123")
        .set("x-user-role", "admin")
        .send({
          puzzleId: "puzzle-123",
          text: "New explanation",
          createdBy: "admin-123",
        })
        .expect(409)
    })
  })

  describe("/puzzle-explanations/puzzle/:puzzleId (GET) - User Access", () => {
    it("should return explanation when user has solved puzzle", async () => {
      // Create explanation
      await explanationRepository.save({
        puzzleId: "puzzle-123",
        text: "Detailed explanation",
        createdBy: "admin-123",
      })

      // Create user solution
      await userSolutionRepository.save({
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
        solutionData: { answer: "42" },
      })

      return request(app.getHttpServer())
        .get("/puzzle-explanations/puzzle/puzzle-123?userId=user-123")
        .expect(200)
        .expect((res) => {
          expect(res.body.puzzleId).toBe("puzzle-123")
          expect(res.body.text).toBe("Detailed explanation")
        })
    })

    it("should return 403 when user has not solved puzzle", async () => {
      await explanationRepository.save({
        puzzleId: "puzzle-123",
        text: "Detailed explanation",
        createdBy: "admin-123",
      })

      return request(app.getHttpServer()).get("/puzzle-explanations/puzzle/puzzle-123?userId=user-123").expect(403)
    })

    it("should return 404 when explanation does not exist", async () => {
      await userSolutionRepository.save({
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: true,
        solutionData: { answer: "42" },
      })

      return request(app.getHttpServer()).get("/puzzle-explanations/puzzle/puzzle-123?userId=user-123").expect(404)
    })
  })

  describe("/puzzle-explanations/puzzle/:puzzleId (PUT) - Admin Only", () => {
    it("should update explanation with admin headers", async () => {
      await explanationRepository.save({
        puzzleId: "puzzle-123",
        text: "Original explanation",
        createdBy: "admin-123",
      })

      return request(app.getHttpServer())
        .put("/puzzle-explanations/puzzle/puzzle-123")
        .set("x-user-id", "admin-123")
        .set("x-user-role", "admin")
        .send({
          text: "Updated explanation text",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.text).toBe("Updated explanation text")
        })
    })
  })

  describe("/user-solutions (POST)", () => {
    it("should record user solution", () => {
      return request(app.getHttpServer())
        .post("/user-solutions")
        .send({
          userId: "user-123",
          puzzleId: "puzzle-123",
          isCorrect: true,
          solutionData: { answer: "42", steps: ["step1", "step2"] },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.puzzleId).toBe("puzzle-123")
          expect(res.body.isCorrect).toBe(true)
          expect(res.body.solutionData).toEqual({ answer: "42", steps: ["step1", "step2"] })
        })
    })

    it("should update existing solution when new one is correct", async () => {
      await userSolutionRepository.save({
        userId: "user-123",
        puzzleId: "puzzle-123",
        isCorrect: false,
        solutionData: { answer: "wrong" },
      })

      return request(app.getHttpServer())
        .post("/user-solutions")
        .send({
          userId: "user-123",
          puzzleId: "puzzle-123",
          isCorrect: true,
          solutionData: { answer: "42" },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.isCorrect).toBe(true)
          expect(res.body.solutionData).toEqual({ answer: "42" })
        })
    })
  })

  describe("/user-solutions/user/:userId (GET)", () => {
    it("should return user solutions", async () => {
      await userSolutionRepository.save([
        {
          userId: "user-123",
          puzzleId: "puzzle-1",
          isCorrect: true,
          solutionData: { answer: "42" },
        },
        {
          userId: "user-123",
          puzzleId: "puzzle-2",
          isCorrect: false,
          solutionData: { answer: "wrong" },
        },
      ])

      return request(app.getHttpServer())
        .get("/user-solutions/user/user-123")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2)
          expect(res.body.every((solution: any) => solution.userId === "user-123")).toBe(true)
        })
    })
  })

  describe("/user-solutions/puzzle/:puzzleId/stats (GET)", () => {
    it("should return puzzle solution statistics", async () => {
      await userSolutionRepository.save([
        {
          userId: "user-1",
          puzzleId: "puzzle-123",
          isCorrect: true,
          solutionData: { answer: "42" },
        },
        {
          userId: "user-2",
          puzzleId: "puzzle-123",
          isCorrect: false,
          solutionData: { answer: "wrong" },
        },
        {
          userId: "user-3",
          puzzleId: "puzzle-123",
          isCorrect: true,
          solutionData: { answer: "42" },
        },
      ])

      return request(app.getHttpServer())
        .get("/user-solutions/puzzle/puzzle-123/stats")
        .expect(200)
        .expect((res) => {
          expect(res.body.totalAttempts).toBe(3)
          expect(res.body.correctSolutions).toBe(2)
        })
    })
  })
})
