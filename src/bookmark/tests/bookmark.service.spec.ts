import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { BookmarkService } from "../services/bookmark.service"
import { Bookmark } from "../entities/bookmark.entity"
import { Puzzle, PuzzleStatus } from "../entities/puzzle.entity"
import type { CreateBookmarkDto } from "../dto/create-bookmark.dto"
import { jest } from "@jest/globals"

describe("BookmarkService", () => {
  let service: BookmarkService
  let bookmarkRepository: Repository<Bookmark>
  let puzzleRepository: Repository<Puzzle>

  const mockBookmarkRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockPuzzleRepository = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        {
          provide: getRepositoryToken(Bookmark),
          useValue: mockBookmarkRepository,
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepository,
        },
      ],
    }).compile()

    service = module.get<BookmarkService>(BookmarkService)
    bookmarkRepository = module.get<Repository<Bookmark>>(getRepositoryToken(Bookmark))
    puzzleRepository = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("addBookmark", () => {
    const createBookmarkDto: CreateBookmarkDto = {
      userId: "user-123",
      puzzleId: "puzzle-123",
    }

    const mockPublishedPuzzle = {
      id: "puzzle-123",
      title: "Test Puzzle",
      status: PuzzleStatus.PUBLISHED,
      bookmarkCount: 5,
    }

    it("should add bookmark successfully", async () => {
      const mockBookmark = {
        id: "bookmark-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        createdAt: new Date(),
      }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPublishedPuzzle)
      mockBookmarkRepository.findOne.mockResolvedValue(null)
      mockBookmarkRepository.create.mockReturnValue(mockBookmark)
      mockBookmarkRepository.save.mockResolvedValue(mockBookmark)
      mockPuzzleRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.addBookmark(createBookmarkDto)

      expect(result.id).toBe("bookmark-123")
      expect(result.userId).toBe("user-123")
      expect(result.puzzleId).toBe("puzzle-123")
      expect(mockPuzzleRepository.update).toHaveBeenCalledWith("puzzle-123", {
        bookmarkCount: 6,
      })
    })

    it("should throw NotFoundException when puzzle does not exist", async () => {
      mockPuzzleRepository.findOne.mockResolvedValue(null)

      await expect(service.addBookmark(createBookmarkDto)).rejects.toThrow(NotFoundException)
    })

    it("should throw NotFoundException when puzzle is not published", async () => {
      const draftPuzzle = { ...mockPublishedPuzzle, status: PuzzleStatus.DRAFT }
      mockPuzzleRepository.findOne.mockResolvedValue(draftPuzzle)

      await expect(service.addBookmark(createBookmarkDto)).rejects.toThrow(NotFoundException)
    })

    it("should throw ConflictException when bookmark already exists", async () => {
      const existingBookmark = { id: "existing-bookmark" }

      mockPuzzleRepository.findOne.mockResolvedValue(mockPublishedPuzzle)
      mockBookmarkRepository.findOne.mockResolvedValue(existingBookmark)

      await expect(service.addBookmark(createBookmarkDto)).rejects.toThrow(ConflictException)
    })
  })

  describe("removeBookmark", () => {
    it("should remove bookmark successfully", async () => {
      const mockBookmark = {
        id: "bookmark-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
      }

      const mockPuzzle = {
        id: "puzzle-123",
        bookmarkCount: 6,
      }

      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark)
      mockPuzzleRepository.findOne.mockResolvedValue(mockPuzzle)
      mockBookmarkRepository.remove.mockResolvedValue(mockBookmark)
      mockPuzzleRepository.update.mockResolvedValue({ affected: 1 })

      await service.removeBookmark("user-123", "puzzle-123")

      expect(mockBookmarkRepository.remove).toHaveBeenCalledWith(mockBookmark)
      expect(mockPuzzleRepository.update).toHaveBeenCalledWith("puzzle-123", {
        bookmarkCount: 5,
      })
    })

    it("should throw NotFoundException when bookmark does not exist", async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null)

      await expect(service.removeBookmark("user-123", "puzzle-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getUserBookmarks", () => {
    it("should return paginated user bookmarks with puzzle details", async () => {
      const mockBookmarks = [
        {
          id: "bookmark-1",
          userId: "user-123",
          puzzleId: "puzzle-1",
          createdAt: new Date(),
        },
        {
          id: "bookmark-2",
          userId: "user-123",
          puzzleId: "puzzle-2",
          createdAt: new Date(),
        },
      ]

      const mockPuzzles = [
        {
          id: "puzzle-1",
          title: "Puzzle 1",
          description: "Description 1",
          difficulty: "medium",
          status: PuzzleStatus.PUBLISHED,
          categoryId: null,
          tags: ["logic"],
          bookmarkCount: 10,
          solveCount: 5,
          createdBy: "admin-123",
        },
        {
          id: "puzzle-2",
          title: "Puzzle 2",
          description: "Description 2",
          difficulty: "hard",
          status: PuzzleStatus.PUBLISHED,
          categoryId: "category-123",
          tags: ["math", "geometry"],
          bookmarkCount: 15,
          solveCount: 8,
          createdBy: "admin-456",
        },
      ]

      mockBookmarkRepository.count.mockResolvedValue(2)
      mockBookmarkRepository.find.mockResolvedValue(mockBookmarks)
      mockPuzzleRepository.findByIds.mockResolvedValue(mockPuzzles)

      const result = await service.getUserBookmarks("user-123", 1, 10)

      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
      expect(result.data[0].puzzleTitle).toBe("Puzzle 1")
      expect(result.data[1].puzzleTitle).toBe("Puzzle 2")
    })

    it("should return empty result when user has no bookmarks", async () => {
      mockBookmarkRepository.count.mockResolvedValue(0)
      mockBookmarkRepository.find.mockResolvedValue([])

      const result = await service.getUserBookmarks("user-123", 1, 10)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it("should handle pagination correctly", async () => {
      mockBookmarkRepository.count.mockResolvedValue(25)
      mockBookmarkRepository.find.mockResolvedValue([])

      const result = await service.getUserBookmarks("user-123", 2, 10)

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(25)
      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.hasNext).toBe(true)
      expect(result.pagination.hasPrevious).toBe(true)
      expect(mockBookmarkRepository.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        order: { createdAt: "DESC" },
        skip: 10,
        take: 10,
      })
    })
  })

  describe("isBookmarked", () => {
    it("should return true when bookmark exists", async () => {
      const mockBookmark = { id: "bookmark-123" }
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark)

      const result = await service.isBookmarked("user-123", "puzzle-123")

      expect(result).toBe(true)
    })

    it("should return false when bookmark does not exist", async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null)

      const result = await service.isBookmarked("user-123", "puzzle-123")

      expect(result).toBe(false)
    })
  })

  describe("getUserBookmarkCount", () => {
    it("should return user bookmark count", async () => {
      mockBookmarkRepository.count.mockResolvedValue(15)

      const result = await service.getUserBookmarkCount("user-123")

      expect(result).toBe(15)
      expect(mockBookmarkRepository.count).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      })
    })
  })

  describe("getBookmarkStats", () => {
    it("should return bookmark statistics", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }

      mockBookmarkRepository.count.mockResolvedValue(100)
      mockBookmarkRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: "25" }) // unique users
        .mockResolvedValueOnce({ count: "50" }) // unique puzzles

      const result = await service.getBookmarkStats()

      expect(result.totalBookmarks).toBe(100)
      expect(result.uniqueUsers).toBe(25)
      expect(result.uniquePuzzles).toBe(50)
      expect(result.averageBookmarksPerUser).toBe(4)
      expect(result.averageBookmarksPerPuzzle).toBe(2)
    })
  })

  describe("bulkRemoveBookmarks", () => {
    it("should remove multiple bookmarks", async () => {
      const puzzleIds = ["puzzle-1", "puzzle-2", "puzzle-3"]
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      }

      mockBookmarkRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
      mockPuzzleRepository.findOne.mockResolvedValue({ id: "puzzle-1", bookmarkCount: 5 })
      mockPuzzleRepository.update.mockResolvedValue({ affected: 1 })

      const result = await service.bulkRemoveBookmarks("user-123", puzzleIds)

      expect(result).toBe(3)
      expect(mockQueryBuilder.execute).toHaveBeenCalled()
    })

    it("should return 0 when no puzzle IDs provided", async () => {
      const result = await service.bulkRemoveBookmarks("user-123", [])

      expect(result).toBe(0)
    })
  })
})
