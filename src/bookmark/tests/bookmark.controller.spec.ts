import { Test, type TestingModule } from "@nestjs/testing"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { BookmarkController } from "../controllers/bookmark.controller"
import { BookmarkService } from "../services/bookmark.service"
import type { CreateBookmarkDto } from "../dto/create-bookmark.dto"
import { BookmarkResponseDto } from "../dto/bookmark-response.dto"
import { UserBookmarkResponseDto } from "../dto/user-bookmark-response.dto"
import { PaginatedResponseDto } from "../dto/pagination.dto"
import { PuzzleStatus } from "../entities/puzzle.entity"
import { jest } from "@jest/globals"

describe("BookmarkController", () => {
  let controller: BookmarkController
  let service: BookmarkService

  const mockBookmarkService = {
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
    getUserBookmarks: jest.fn(),
    getUserBookmarkIds: jest.fn(),
    isBookmarked: jest.fn(),
    getBookmarksByPuzzle: jest.fn(),
    getUserBookmarkCount: jest.fn(),
    getPuzzleBookmarkCount: jest.fn(),
    getBookmarkStats: jest.fn(),
    bulkRemoveBookmarks: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarkController],
      providers: [
        {
          provide: BookmarkService,
          useValue: mockBookmarkService,
        },
      ],
    }).compile()

    controller = module.get<BookmarkController>(BookmarkController)
    service = module.get<BookmarkService>(BookmarkService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("addBookmark", () => {
    const createBookmarkDto: CreateBookmarkDto = {
      userId: "user-123",
      puzzleId: "puzzle-123",
    }

    it("should add bookmark successfully", async () => {
      const expectedResponse = new BookmarkResponseDto({
        id: "bookmark-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        createdAt: new Date(),
      })

      mockBookmarkService.addBookmark.mockResolvedValue(expectedResponse)

      const result = await controller.addBookmark(createBookmarkDto)

      expect(result).toEqual(expectedResponse)
      expect(mockBookmarkService.addBookmark).toHaveBeenCalledWith(createBookmarkDto)
    })

    it("should throw ConflictException when bookmark already exists", async () => {
      mockBookmarkService.addBookmark.mockRejectedValue(
        new ConflictException("Puzzle is already bookmarked by this user"),
      )

      await expect(controller.addBookmark(createBookmarkDto)).rejects.toThrow(ConflictException)
    })

    it("should throw NotFoundException when puzzle not found", async () => {
      mockBookmarkService.addBookmark.mockRejectedValue(new NotFoundException("Puzzle not found"))

      await expect(controller.addBookmark(createBookmarkDto)).rejects.toThrow(NotFoundException)
    })
  })

  describe("removeBookmark", () => {
    it("should remove bookmark successfully", async () => {
      mockBookmarkService.removeBookmark.mockResolvedValue(undefined)

      await controller.removeBookmark("user-123", "puzzle-123")

      expect(mockBookmarkService.removeBookmark).toHaveBeenCalledWith("user-123", "puzzle-123")
    })

    it("should throw NotFoundException when bookmark not found", async () => {
      mockBookmarkService.removeBookmark.mockRejectedValue(new NotFoundException("Bookmark not found"))

      await expect(controller.removeBookmark("user-123", "puzzle-123")).rejects.toThrow(NotFoundException)
    })
  })

  describe("getUserBookmarks", () => {
    it("should return paginated user bookmarks", async () => {
      const mockBookmark = {
        id: "bookmark-123",
        userId: "user-123",
        puzzleId: "puzzle-123",
        createdAt: new Date(),
      }

      const mockPuzzle = {
        id: "puzzle-123",
        title: "Test Puzzle",
        description: "Test Description",
        difficulty: "medium",
        status: PuzzleStatus.PUBLISHED,
        categoryId: null,
        tags: ["logic"],
        bookmarkCount: 10,
        solveCount: 5,
        createdBy: "admin-123",
      }

      const userBookmark = new UserBookmarkResponseDto(mockBookmark, mockPuzzle)
      const expectedResponse = new PaginatedResponseDto([userBookmark], 1, 10, 1)

      mockBookmarkService.getUserBookmarks.mockResolvedValue(expectedResponse)

      const result = await controller.getUserBookmarks("user-123", { page: 1, limit: 10 })

      expect(result).toEqual(expectedResponse)
      expect(mockBookmarkService.getUserBookmarks).toHaveBeenCalledWith("user-123", 1, 10)
    })

    it("should use default pagination values", async () => {
      const expectedResponse = new PaginatedResponseDto([], 1, 10, 0)
      mockBookmarkService.getUserBookmarks.mockResolvedValue(expectedResponse)

      await controller.getUserBookmarks("user-123", {})

      expect(mockBookmarkService.getUserBookmarks).toHaveBeenCalledWith("user-123", 1, 10)
    })
  })

  describe("getUserBookmarkIds", () => {
    it("should return user bookmark puzzle IDs", async () => {
      const puzzleIds = ["puzzle-1", "puzzle-2", "puzzle-3"]
      mockBookmarkService.getUserBookmarkIds.mockResolvedValue(puzzleIds)

      const result = await controller.getUserBookmarkIds("user-123")

      expect(result).toEqual({ puzzleIds })
      expect(mockBookmarkService.getUserBookmarkIds).toHaveBeenCalledWith("user-123")
    })
  })

  describe("checkBookmarkStatus", () => {
    it("should return true when puzzle is bookmarked", async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(true)

      const result = await controller.checkBookmarkStatus("user-123", "puzzle-123")

      expect(result).toEqual({ isBookmarked: true })
      expect(mockBookmarkService.isBookmarked).toHaveBeenCalledWith("user-123", "puzzle-123")
    })

    it("should return false when puzzle is not bookmarked", async () => {
      mockBookmarkService.isBookmarked.mockResolvedValue(false)

      const result = await controller.checkBookmarkStatus("user-123", "puzzle-123")

      expect(result).toEqual({ isBookmarked: false })
    })
  })

  describe("getUserBookmarkCount", () => {
    it("should return user bookmark count", async () => {
      mockBookmarkService.getUserBookmarkCount.mockResolvedValue(15)

      const result = await controller.getUserBookmarkCount("user-123")

      expect(result).toEqual({ count: 15 })
      expect(mockBookmarkService.getUserBookmarkCount).toHaveBeenCalledWith("user-123")
    })
  })

  describe("getPuzzleBookmarkCount", () => {
    it("should return puzzle bookmark count", async () => {
      mockBookmarkService.getPuzzleBookmarkCount.mockResolvedValue(42)

      const result = await controller.getPuzzleBookmarkCount("puzzle-123")

      expect(result).toEqual({ count: 42 })
      expect(mockBookmarkService.getPuzzleBookmarkCount).toHaveBeenCalledWith("puzzle-123")
    })
  })

  describe("getBookmarkStats", () => {
    it("should return bookmark statistics", async () => {
      const expectedStats = {
        totalBookmarks: 1000,
        uniqueUsers: 250,
        uniquePuzzles: 500,
        averageBookmarksPerUser: 4.0,
        averageBookmarksPerPuzzle: 2.0,
      }

      mockBookmarkService.getBookmarkStats.mockResolvedValue(expectedStats)

      const result = await controller.getBookmarkStats()

      expect(result).toEqual(expectedStats)
      expect(mockBookmarkService.getBookmarkStats).toHaveBeenCalled()
    })
  })

  describe("bulkRemoveBookmarks", () => {
    it("should remove multiple bookmarks", async () => {
      mockBookmarkService.bulkRemoveBookmarks.mockResolvedValue(3)

      const result = await controller.bulkRemoveBookmarks("user-123", "puzzle-1,puzzle-2,puzzle-3")

      expect(result).toEqual({ removed: 3 })
      expect(mockBookmarkService.bulkRemoveBookmarks).toHaveBeenCalledWith("user-123", [
        "puzzle-1",
        "puzzle-2",
        "puzzle-3",
      ])
    })

    it("should handle empty puzzle IDs", async () => {
      mockBookmarkService.bulkRemoveBookmarks.mockResolvedValue(0)

      const result = await controller.bulkRemoveBookmarks("user-123", "")

      expect(result).toEqual({ removed: 0 })
      expect(mockBookmarkService.bulkRemoveBookmarks).toHaveBeenCalledWith("user-123", [])
    })
  })
})
