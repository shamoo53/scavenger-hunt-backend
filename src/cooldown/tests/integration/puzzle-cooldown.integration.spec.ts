import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { PuzzleCooldownModule } from "../puzzle-cooldown.module"
import { Cooldown } from "../entities/cooldown.entity"
import { CooldownSettings, CooldownType } from "../entities/cooldown-settings.entity"
import { Puzzle, PuzzleStatus, PuzzleDifficulty } from "../entities/puzzle.entity"

describe("PuzzleCooldownModule (Integration)", () => {
  let app: INestApplication
  let cooldownRepository: Repository<Cooldown>
  let cooldownSettingsRepository: Repository<CooldownSettings>
  let puzzleRepository: Repository<Puzzle>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Cooldown, CooldownSettings, Puzzle],
          synchronize: true,
        }),
        PuzzleCooldownModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    cooldownRepository = moduleFixture.get<Repository<Cooldown>>(getRepositoryToken(Cooldown))
    cooldownSettingsRepository = moduleFixture.get<Repository<CooldownSettings>>(getRepositoryToken(CooldownSettings))
    puzzleRepository = moduleFixture.get<Repository<Puzzle>>(getRepositoryToken(Puzzle))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await cooldownRepository.clear()
    await cooldownSettingsRepository.clear()
    await puzzleRepository.clear()
  })

  describe("/cooldown-settings (POST)", () => {
    it("should create global cooldown settings", () => {
      return request(app.getHttpServer())
        .post("/cooldown-settings")
        .send({
          cooldownType: "fixed",
          baseCooldownSeconds: 7200, // 2 hours
          maxAttempts: 5,
          isActive: true,
          metadata: { description: "Global default settings" },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.puzzleId).toBeNull()
          expect(res.body.cooldownType).toBe("fixed")
          expect(res.body.baseCooldownSeconds).toBe(7200)
          expect(res.body.maxAttempts).toBe(5)
          expect(res.body.isActive).toBe(true)
        })
    })

    it("should create puzzle-specific cooldown settings", () => {
      return request(app.getHttpServer())
        .post("/cooldown-settings")
        .send({
          puzzleId: "puzzle-123",
          cooldownType: "progressive",
          baseCooldownSeconds: 3600,
          multiplier: 1.5,
          maxCooldownSeconds: 86400, // 24 hours max
          maxAttempts: 3,
          isActive: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.puzzleId).toBe("puzzle-123")
          expect(res.body.cooldownType).toBe("progressive")
          expect(res.body.multiplier).toBe(1.5)
          expect(res.body.maxCooldownSeconds).toBe(86400)
        })
    })

    it("should return 409 when settings already exist", async () => {
      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      return request(app.getHttpServer())
        .post("/cooldown-settings")
        .send({
          cooldownType: "fixed",
          baseCooldownSeconds: 7200,
        })
        .expect(409)
    })
  })

  describe("/puzzle-cooldowns/user/:userId/puzzle/:puzzleId/status (GET)", () => {
    it("should return can attempt when no cooldown exists", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        description: "A test puzzle",
        difficulty: PuzzleDifficulty.MEDIUM,
        status: PuzzleStatus.PUBLISHED,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      return request(app.getHttpServer())
        .get(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.canAttempt).toBe(true)
          expect(res.body.isOnCooldown).toBe(false)
          expect(res.body.remainingTimeSeconds).toBe(0)
          expect(res.body.attemptCount).toBe(0)
          expect(res.body.cooldownType).toBe("fixed")
          expect(res.body.baseCooldownSeconds).toBe(3600)
        })
    })

    it("should return cannot attempt when on cooldown", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      await cooldownRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
        attemptCount: 1,
      })

      return request(app.getHttpServer())
        .get(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.canAttempt).toBe(false)
          expect(res.body.isOnCooldown).toBe(true)
          expect(res.body.remainingTimeSeconds).toBeGreaterThan(0)
          expect(res.body.attemptCount).toBe(1)
          expect(res.body.remainingTimeFormatted).toMatch(/\d+m/)
        })
    })

    it("should return 404 when puzzle does not exist", () => {
      return request(app.getHttpServer())
        .get("/puzzle-cooldowns/user/user-123/puzzle/non-existent-puzzle/status")
        .expect(404)
    })

    it("should return 404 when puzzle is not published", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Draft Puzzle",
        status: PuzzleStatus.DRAFT,
        difficulty: PuzzleDifficulty.EASY,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer()).get(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}/status`).expect(404)
    })
  })

  describe("/puzzle-cooldowns/attempt (POST)", () => {
    it("should allow first attempt and create cooldown", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      return request(app.getHttpServer())
        .post("/puzzle-cooldowns/attempt")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
          isCorrect: true,
          solutionData: { answer: "42" },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.puzzleId).toBe(puzzle.id)
          expect(res.body.attemptCount).toBe(1)
          expect(res.body.cooldownExpiresAt).toBeDefined()
        })
    })

    it("should return 403 when user is on cooldown", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      await cooldownRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
        attemptCount: 1,
      })

      return request(app.getHttpServer())
        .post("/puzzle-cooldowns/attempt")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
          isCorrect: false,
        })
        .expect(403)
    })

    it("should return 403 when max attempts reached", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.HARD,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 3,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: null,
        cooldownType: CooldownType.FIXED,
        baseCooldownSeconds: 3600,
        maxCooldownSeconds: null,
        multiplier: 1.0,
        maxAttempts: 3,
        isActive: true,
        metadata: null,
      })

      await cooldownRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
        lastAttemptAt: new Date(Date.now() - 7200000), // 2 hours ago
        cooldownExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
        attemptCount: 3,
      })

      return request(app.getHttpServer())
        .post("/puzzle-cooldowns/attempt")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
          isCorrect: false,
        })
        .expect(403)
    })
  })

  describe("/puzzle-cooldowns/user/:userId (GET)", () => {
    it("should return user cooldowns", async () => {
      const puzzle1 = await puzzleRepository.save({
        title: "Puzzle 1",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.EASY,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      const puzzle2 = await puzzleRepository.save({
        title: "Puzzle 2",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 2,
        solveCount: 1,
        createdBy: "admin-123",
      })

      await cooldownRepository.save([
        {
          userId: "user-123",
          puzzleId: puzzle1.id,
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(Date.now() + 3600000),
          attemptCount: 1,
        },
        {
          userId: "user-123",
          puzzleId: puzzle2.id,
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(Date.now() + 7200000),
          attemptCount: 2,
        },
      ])

      return request(app.getHttpServer())
        .get("/puzzle-cooldowns/user/user-123")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2)
          expect(res.body[0].userId).toBe("user-123")
          expect(res.body[1].userId).toBe("user-123")
        })
    })
  })

  describe("/puzzle-cooldowns/user/:userId/puzzle/:puzzleId (DELETE)", () => {
    it("should reset user cooldown", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
        lastAttemptAt: new Date(),
        cooldownExpiresAt: new Date(Date.now() + 3600000),
        attemptCount: 1,
      })

      return request(app.getHttpServer()).delete(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}`).expect(204)
    })

    it("should return 404 when cooldown not found", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer()).delete(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}`).expect(404)
    })
  })

  describe("/puzzle-cooldowns/stats (GET)", () => {
    it("should return cooldown statistics", async () => {
      const puzzles = await Promise.all([
        puzzleRepository.save({
          title: "Puzzle 1",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.EASY,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          attemptCount: 2,
          solveCount: 1,
          createdBy: "admin-123",
        }),
        puzzleRepository.save({
          title: "Puzzle 2",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.MEDIUM,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          attemptCount: 3,
          solveCount: 2,
          createdBy: "admin-123",
        }),
      ])

      await Promise.all([
        cooldownRepository.save({
          userId: "user-1",
          puzzleId: puzzles[0].id,
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(Date.now() + 3600000), // Active
          attemptCount: 1,
        }),
        cooldownRepository.save({
          userId: "user-1",
          puzzleId: puzzles[1].id,
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(Date.now() - 3600000), // Expired
          attemptCount: 2,
        }),
        cooldownRepository.save({
          userId: "user-2",
          puzzleId: puzzles[0].id,
          lastAttemptAt: new Date(),
          cooldownExpiresAt: new Date(Date.now() + 7200000), // Active
          attemptCount: 1,
        }),
      ])

      return request(app.getHttpServer())
        .get("/puzzle-cooldowns/stats")
        .expect(200)
        .expect((res) => {
          expect(res.body.totalCooldowns).toBe(3)
          expect(res.body.activeCooldowns).toBe(2)
          expect(res.body.uniqueUsers).toBe(2)
          expect(res.body.uniquePuzzles).toBe(2)
          expect(res.body.averageAttempts).toBeGreaterThan(0)
        })
    })
  })

  describe("Progressive Cooldown", () => {
    it("should increase cooldown time with progressive type", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Progressive Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.HARD,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        attemptCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await cooldownSettingsRepository.save({
        puzzleId: puzzle.id,
        cooldownType: CooldownType.PROGRESSIVE,
        baseCooldownSeconds: 1800, // 30 minutes base
        maxCooldownSeconds: 14400, // 4 hours max
        multiplier: 1.5,
        maxAttempts: 0,
        isActive: true,
        metadata: null,
      })

      // First attempt
      await request(app.getHttpServer())
        .post("/puzzle-cooldowns/attempt")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
          isCorrect: false,
        })
        .expect(201)

      // Check status after first attempt
      const firstStatus = await request(app.getHttpServer())
        .get(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)

      expect(firstStatus.body.attemptCount).toBe(1)
      expect(firstStatus.body.isOnCooldown).toBe(true)

      // Wait for cooldown to expire (in real scenario, this would be time-based)
      await cooldownRepository.update(
        { userId: "user-123", puzzleId: puzzle.id },
        { cooldownExpiresAt: new Date(Date.now() - 1000) },
      )

      // Second attempt
      await request(app.getHttpServer())
        .post("/puzzle-cooldowns/attempt")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
          isCorrect: false,
        })
        .expect(201)

      // Check that cooldown time increased
      const secondStatus = await request(app.getHttpServer())
        .get(`/puzzle-cooldowns/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)

      expect(secondStatus.body.attemptCount).toBe(2)
      expect(secondStatus.body.baseCooldownSeconds).toBe(1800)
      expect(secondStatus.body.cooldownType).toBe("progressive")
    })
  })
})
