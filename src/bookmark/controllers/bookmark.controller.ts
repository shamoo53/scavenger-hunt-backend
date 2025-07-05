import { Controller, Post, Delete, Get, Query, HttpCode, HttpStatus } from "@nestjs/common"
import type { BookmarkService } from "../services/bookmark.service"
import type { CreateBookmarkDto } from "../dto/create-bookmark.dto"
import type { BookmarkResponseDto } from "../dto/bookmark-response.dto"
import type { UserBookmarkResponseDto } from "../dto/user-bookmark-response.dto"
import type { PaginationDto, PaginatedResponseDto } from "../dto/pagination.dto"

@Controller("puzzle-bookmarks")
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addBookmark(createBookmarkDto: CreateBookmarkDto): Promise<BookmarkResponseDto> {
    return this.bookmarkService.addBookmark(createBookmarkDto)
  }

  @Delete("user/:userId/puzzle/:puzzleId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBookmark(userId: string, puzzleId: string): Promise<void> {
    return this.bookmarkService.removeBookmark(userId, puzzleId)
  }

  @Get("user/:userId")
  async getUserBookmarks(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserBookmarkResponseDto>> {
    const { page, limit } = paginationDto
    return this.bookmarkService.getUserBookmarks(userId, page, limit)
  }

  @Get("user/:userId/puzzle-ids")
  async getUserBookmarkIds(userId: string): Promise<{ puzzleIds: string[] }> {
    const puzzleIds = await this.bookmarkService.getUserBookmarkIds(userId)
    return { puzzleIds }
  }

  @Get("user/:userId/puzzle/:puzzleId/status")
  async checkBookmarkStatus(userId: string, puzzleId: string): Promise<{ isBookmarked: boolean }> {
    const isBookmarked = await this.bookmarkService.isBookmarked(userId, puzzleId)
    return { isBookmarked }
  }

  @Get("puzzle/:puzzleId")
  async getBookmarksByPuzzle(puzzleId: string): Promise<BookmarkResponseDto[]> {
    return this.bookmarkService.getBookmarksByPuzzle(puzzleId)
  }

  @Get("user/:userId/count")
  async getUserBookmarkCount(userId: string): Promise<{ count: number }> {
    const count = await this.bookmarkService.getUserBookmarkCount(userId)
    return { count }
  }

  @Get("puzzle/:puzzleId/count")
  async getPuzzleBookmarkCount(puzzleId: string): Promise<{ count: number }> {
    const count = await this.bookmarkService.getPuzzleBookmarkCount(puzzleId)
    return { count }
  }

  @Get("stats")
  async getBookmarkStats(): Promise<{
    totalBookmarks: number
    uniqueUsers: number
    uniquePuzzles: number
    averageBookmarksPerUser: number
    averageBookmarksPerPuzzle: number
  }> {
    return this.bookmarkService.getBookmarkStats()
  }

  @Delete("user/:userId/bulk")
  @HttpCode(HttpStatus.OK)
  async bulkRemoveBookmarks(userId: string, @Query('puzzleIds') puzzleIds: string): Promise<{ removed: number }> {
    const puzzleIdArray = puzzleIds ? puzzleIds.split(",") : []
    const removed = await this.bookmarkService.bulkRemoveBookmarks(userId, puzzleIdArray)
    return { removed }
  }
}
