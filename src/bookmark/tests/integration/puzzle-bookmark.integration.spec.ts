import { Test, type TestingModule } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { getRepositoryToken } from "@nestjs/typeorm"
import * as request from "supertest"
import { PuzzleBookmarkModule } from "../puzzle-bookmark.module"
import { Bookmark } from "../entities/bookmark.entity"
import { Puzzle, PuzzleStatus, PuzzleDifficulty } from "../entities/puzzle.entity"

describe("PuzzleBookmarkModule (Integration)", () => {
  let app: INestApplication
  let bookmarkRepository: Repository<Bookmark>
  let puzzleRepository: Repository<Puzzle>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Bookmark, Puzzle],
          synchronize: true,
        }),
        PuzzleBookmarkModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    bookmarkRepository = moduleFixture.get<Repository<Bookmark>>(getRepositoryToken(Bookmark))
    puzzleRepository = moduleFixture.get<Repository<Puzzle>>(getRepositoryToken(Puzzle))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await bookmarkRepository.clear()
    await puzzleRepository.clear()
  })

  describe("/puzzles (POST)", () => {
    it("should create a puzzle", () => {
      return request(app.getHttpServer())
        .post("/puzzles")
        .send({
          title: "Logic Puzzle",
          description: "A challenging logic puzzle",
          difficulty: "medium",
          status: "published",
          categoryId: "category-123",
          tags: ["logic", "reasoning"],
          content: { question: "What comes next?" },
          solution: { answer: "42" },
          createdBy: "admin-123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe("Logic Puzzle")
          expect(res.body.difficulty).toBe("medium")
          expect(res.body.status).toBe("published")
          expect(res.body.tags).toEqual(["logic", "reasoning"])
          expect(res.body.bookmarkCount).toBe(0)
        })
    })
  })

  describe("/puzzle-bookmarks (POST)", () => {
    it("should add bookmark to published puzzle", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        description: "A test puzzle",
        difficulty: PuzzleDifficulty.MEDIUM,
        status: PuzzleStatus.PUBLISHED,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer())
        .post("/puzzle-bookmarks")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.userId).toBe("user-123")
          expect(res.body.puzzleId).toBe(puzzle.id)
          expect(res.body.createdAt).toBeDefined()
        })
    })

    it("should return 404 when puzzle does not exist", () => {
      return request(app.getHttpServer())
        .post("/puzzle-bookmarks")
        .send({
          userId: "user-123",
          puzzleId: "non-existent-puzzle",
        })
        .expect(404)
    })

    it("should return 404 when puzzle is not published", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Draft Puzzle",
        description: "A draft puzzle",
        difficulty: PuzzleDifficulty.EASY,
        status: PuzzleStatus.DRAFT,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer())
        .post("/puzzle-bookmarks")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
        })
        .expect(404)
    })

    it("should return 409 when user tries to bookmark same puzzle twice", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      // First bookmark
      await request(app.getHttpServer())
        .post("/puzzle-bookmarks")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
        })
        .expect(201)

      // Second bookmark attempt
      return request(app.getHttpServer())
        .post("/puzzle-bookmarks")
        .send({
          userId: "user-123",
          puzzleId: puzzle.id,
        })
        .expect(409)
    })
  })

  describe("/puzzle-bookmarks/user/:userId (GET)", () => {
    it("should return paginated user bookmarks with puzzle details", async () => {
      const puzzle1 = await puzzleRepository.save({
        title: "Puzzle 1",
        description: "First puzzle",
        difficulty: PuzzleDifficulty.EASY,
        status: PuzzleStatus.PUBLISHED,
        categoryId: "category-1",
        tags: ["logic"],
        content: { question: "Q1" },
        solution: { answer: "A1" },
        bookmarkCount: 1,
        solveCount: 5,
        createdBy: "admin-123",
      })

      const puzzle2 = await puzzleRepository.save({
        title: "Puzzle 2",
        description: "Second puzzle",
        difficulty: PuzzleDifficulty.HARD,
        status: PuzzleStatus.PUBLISHED,
        categoryId: "category-2",
        tags: ["math", "geometry"],
        content: { question: "Q2" },
        solution: { answer: "A2" },
        bookmarkCount: 1,
        solveCount: 3,
        createdBy: "admin-456",
      })

      await bookmarkRepository.save([
        {
          userId: "user-123",
          puzzleId: puzzle1.id,
        },
        {
          userId: "user-123",
          puzzleId: puzzle2.id,
        },
      ])

      return request(app.getHttpServer())
        .get("/puzzle-bookmarks/user/user-123?page=1&limit=10")
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2)
          expect(res.body.pagination.total).toBe(2)
          expect(res.body.pagination.page).toBe(1)
          expect(res.body.pagination.limit).toBe(10)
          expect(res.body.pagination.totalPages).toBe(1)
          expect(res.body.pagination.hasNext).toBe(false)
          expect(res.body.pagination.hasPrevious).toBe(false)

          // Check puzzle details are included
          expect(res.body.data[0].puzzleTitle).toBeDefined()
          expect(res.body.data[0].puzzleDifficulty).toBeDefined()
          expect(res.body.data[0].puzzleTags).toBeDefined()
        })
    })

    it("should handle pagination correctly", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      // Create 15 bookmarks for different users
      const bookmarks = Array.from({ length: 15 }, (_, i) => ({
        userId: "user-123",
        puzzleId: puzzle.id,
      }))

      // Since we have unique constraint, we'll create different puzzles
      const puzzles = await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          puzzleRepository.save({
            title: `Puzzle ${i + 1}`,
            status: PuzzleStatus.PUBLISHED,
            difficulty: PuzzleDifficulty.MEDIUM,
            categoryId: null,
            tags: [],
            content: null,
            solution: null,
            bookmarkCount: 0,
            solveCount: 0,
            createdBy: "admin-123",
          }),
        ),
      )

      await Promise.all(
        puzzles.map((p) =>
          bookmarkRepository.save({
            userId: "user-123",
            puzzleId: p.id,
          }),
        ),
      )

      return request(app.getHttpServer())
        .get("/puzzle-bookmarks/user/user-123?page=2&limit=5")
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(5)
          expect(res.body.pagination.page).toBe(2)
          expect(res.body.pagination.limit).toBe(5)
          expect(res.body.pagination.total).toBe(15)
          expect(res.body.pagination.totalPages).toBe(3)
          expect(res.body.pagination.hasNext).toBe(true)
          expect(res.body.pagination.hasPrevious).toBe(true)
        })
    })

    it("should return empty result when user has no bookmarks", () => {
      return request(app.getHttpServer())
        .get("/puzzle-bookmarks/user/user-456")
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([])
          expect(res.body.pagination.total).toBe(0)
        })
    })
  })

  describe("/puzzle-bookmarks/user/:userId/puzzle/:puzzleId (DELETE)", () => {
    it("should remove bookmark successfully", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await bookmarkRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
      })

      return request(app.getHttpServer()).delete(`/puzzle-bookmarks/user/user-123/puzzle/${puzzle.id}`).expect(204)
    })

    it("should return 404 when bookmark does not exist", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer()).delete(`/puzzle-bookmarks/user/user-123/puzzle/${puzzle.id}`).expect(404)
    })
  })

  describe("/puzzle-bookmarks/user/:userId/puzzle/:puzzleId/status (GET)", () => {
    it("should return true when puzzle is bookmarked", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 1,
        solveCount: 0,
        createdBy: "admin-123",
      })

      await bookmarkRepository.save({
        userId: "user-123",
        puzzleId: puzzle.id,
      })

      return request(app.getHttpServer())
        .get(`/puzzle-bookmarks/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isBookmarked).toBe(true)
        })
    })

    it("should return false when puzzle is not bookmarked", async () => {
      const puzzle = await puzzleRepository.save({
        title: "Test Puzzle",
        status: PuzzleStatus.PUBLISHED,
        difficulty: PuzzleDifficulty.MEDIUM,
        categoryId: null,
        tags: [],
        content: null,
        solution: null,
        bookmarkCount: 0,
        solveCount: 0,
        createdBy: "admin-123",
      })

      return request(app.getHttpServer())
        .get(`/puzzle-bookmarks/user/user-123/puzzle/${puzzle.id}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isBookmarked).toBe(false)
        })
    })
  })

  describe("/puzzle-bookmarks/user/:userId/count (GET)", () => {
    it("should return user bookmark count", async () => {
      const puzzles = await Promise.all([
        puzzleRepository.save({
          title: "Puzzle 1",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.EASY,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          bookmarkCount: 0,
          solveCount: 0,
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
          bookmarkCount: 0,
          solveCount: 0,
          createdBy: "admin-123",
        }),
        puzzleRepository.save({
          title: "Puzzle 3",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.HARD,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          bookmarkCount: 0,
          solveCount: 0,
          createdBy: "admin-123",
        }),
      ])

      await Promise.all(
        puzzles.map((puzzle) =>
          bookmarkRepository.save({
            userId: "user-123",
            puzzleId: puzzle.id,
          }),
        ),
      )

      return request(app.getHttpServer())
        .get("/puzzle-bookmarks/user/user-123/count")
        .expect(200)
        .expect((res) => {
          expect(res.body.count).toBe(3)
        })
    })
  })

  describe("/puzzle-bookmarks/stats (GET)", () => {
    it("should return bookmark statistics", async () => {
      const puzzles = await Promise.all([
        puzzleRepository.save({
          title: "Puzzle 1",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.EASY,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          bookmarkCount: 0,
          solveCount: 0,
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
          bookmarkCount: 0,
          solveCount: 0,
          createdBy: "admin-123",
        }),
      ])

      await Promise.all([
        bookmarkRepository.save({
          userId: "user-1",
          puzzleId: puzzles[0].id,
        }),
        bookmarkRepository.save({
          userId: "user-1",
          puzzleId: puzzles[1].id,
        }),
        bookmarkRepository.save({
          userId: "user-2",
          puzzleId: puzzles[0].id,
        }),
        bookmarkRepository.save({
          userId: "user-3",
          puzzleId: puzzles[1].id,
        }),
      ])

      return request(app.getHttpServer())
        .get("/puzzle-bookmarks/stats")
        .expect(200)
        .expect((res) => {
          expect(res.body.totalBookmarks).toBe(4)
          expect(res.body.uniqueUsers).toBe(3)
          expect(res.body.uniquePuzzles).toBe(2)
          expect(res.body.averageBookmarksPerUser).toBeGreaterThan(0)
          expect(res.body.averageBookmarksPerPuzzle).toBeGreaterThan(0)
        })
    })
  })

  describe("/puzzle-bookmarks/user/:userId/bulk (DELETE)", () => {
    it("should remove multiple bookmarks", async () => {
      const puzzles = await Promise.all([
        puzzleRepository.save({
          title: "Puzzle 1",
          status: PuzzleStatus.PUBLISHED,
          difficulty: PuzzleDifficulty.EASY,
          categoryId: null,
          tags: [],
          content: null,
          solution: null,
          bookmarkCount: 1,
          solveCount: 0,
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
          bookmarkCount: 1,
          solveCount: 0,
          createdBy: "admin-123",
        }),
      ])

      await Promise.all(
        puzzles.map((puzzle) =>
          bookmarkRepository.save({
            userId: "user-123",
            puzzleId: puzzle.id,
          }),
        ),
      )

      const puzzleIds = puzzles.map((p) => p.id).join(",")

      return request(app.getHttpServer())
        .delete(`/puzzle-bookmarks/user/user-123/bulk?puzzleIds=${puzzleIds}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.removed).toBe(2)
        })
    })
  })
})
