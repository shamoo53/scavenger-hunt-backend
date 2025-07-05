import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { Bookmark } from "../entities/bookmark.entity"
import type { Puzzle } from "../entities/puzzle.entity"
import { PuzzleStatus } from "../entities/puzzle.entity"
import type { CreateBookmarkDto } from "../dto/create-bookmark.dto"
import { BookmarkResponseDto } from "../dto/bookmark-response.dto"
import { UserBookmarkResponseDto } from "../dto/user-bookmark-response.dto"
import { PaginatedResponseDto } from "../dto/pagination.dto"

@Injectable()
export class BookmarkService {
  private readonly bookmarkRepository: Repository<Bookmark>
  private readonly puzzleRepository: Repository<Puzzle>

  constructor(bookmarkRepository: Repository<Bookmark>, puzzleRepository: Repository<Puzzle>) {
    this.bookmarkRepository = bookmarkRepository
    this.puzzleRepository = puzzleRepository
  }

  async addBookmark(createBookmarkDto: CreateBookmarkDto): Promise<BookmarkResponseDto> {
    const { userId, puzzleId } = createBookmarkDto

    // Check if puzzle exists and is published
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    if (!puzzle) {
      throw new NotFoundException("Puzzle not found")
    }

    if (puzzle.status !== PuzzleStatus.PUBLISHED) {
      throw new NotFoundException("Puzzle is not available for bookmarking")
    }

    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepository.findOne({
      where: { userId, puzzleId },
    })

    if (existingBookmark) {
      throw new ConflictException("Puzzle is already bookmarked by this user")
    }

    // Create bookmark
    const bookmark = this.bookmarkRepository.create({
      userId,
      puzzleId,
    })

    const savedBookmark = await this.bookmarkRepository.save(bookmark)

    // Update puzzle bookmark count
    await this.puzzleRepository.update(puzzleId, {
      bookmarkCount: puzzle.bookmarkCount + 1,
    })

    return new BookmarkResponseDto(savedBookmark)
  }

  async removeBookmark(userId: string, puzzleId: string): Promise<void> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { userId, puzzleId },
    })

    if (!bookmark) {
      throw new NotFoundException("Bookmark not found")
    }

    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    // Remove bookmark
    await this.bookmarkRepository.remove(bookmark)

    // Update puzzle bookmark count
    if (puzzle && puzzle.bookmarkCount > 0) {
      await this.puzzleRepository.update(puzzleId, {
        bookmarkCount: puzzle.bookmarkCount - 1,
      })
    }
  }

  async getUserBookmarks(userId: string, page = 1, limit = 10): Promise<PaginatedResponseDto<UserBookmarkResponseDto>> {
    const offset = (page - 1) * limit

    // Get total count
    const total = await this.bookmarkRepository.count({
      where: { userId },
    })

    // Get bookmarks with pagination
    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: offset,
      take: limit,
    })

    if (bookmarks.length === 0) {
      return new PaginatedResponseDto<UserBookmarkResponseDto>([], page, limit, total)
    }

    // Get puzzle details
    const puzzleIds = bookmarks.map((bookmark) => bookmark.puzzleId)
    const puzzles = await this.puzzleRepository.findByIds(puzzleIds)
    const puzzleMap = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]))

    // Combine bookmark and puzzle data
    const userBookmarks = bookmarks
      .map((bookmark) => {
        const puzzle = puzzleMap.get(bookmark.puzzleId)
        return puzzle ? new UserBookmarkResponseDto(bookmark, puzzle) : null
      })
      .filter((item): item is UserBookmarkResponseDto => item !== null)

    return new PaginatedResponseDto<UserBookmarkResponseDto>(userBookmarks, page, limit, total)
  }

  async getUserBookmarkIds(userId: string): Promise<string[]> {
    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      select: ["puzzleId"],
    })

    return bookmarks.map((bookmark) => bookmark.puzzleId)
  }

  async isBookmarked(userId: string, puzzleId: string): Promise<boolean> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { userId, puzzleId },
    })

    return !!bookmark
  }

  async getBookmarksByPuzzle(puzzleId: string): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.bookmarkRepository.find({
      where: { puzzleId },
      order: { createdAt: "DESC" },
    })

    return bookmarks.map((bookmark) => new BookmarkResponseDto(bookmark))
  }

  async getUserBookmarkCount(userId: string): Promise<number> {
    return this.bookmarkRepository.count({
      where: { userId },
    })
  }

  async getPuzzleBookmarkCount(puzzleId: string): Promise<number> {
    return this.bookmarkRepository.count({
      where: { puzzleId },
    })
  }

  async getBookmarkStats(): Promise<{
    totalBookmarks: number
    uniqueUsers: number
    uniquePuzzles: number
    averageBookmarksPerUser: number
    averageBookmarksPerPuzzle: number
  }> {
    const totalBookmarks = await this.bookmarkRepository.count()

    const uniqueUsersResult = await this.bookmarkRepository
      .createQueryBuilder("bookmark")
      .select("COUNT(DISTINCT bookmark.userId)", "count")
      .getRawOne()

    const uniquePuzzlesResult = await this.bookmarkRepository
      .createQueryBuilder("bookmark")
      .select("COUNT(DISTINCT bookmark.puzzleId)", "count")
      .getRawOne()

    const uniqueUsers = Number.parseInt(uniqueUsersResult?.count || "0", 10)
    const uniquePuzzles = Number.parseInt(uniquePuzzlesResult?.count || "0", 10)

    const averageBookmarksPerUser = uniqueUsers > 0 ? totalBookmarks / uniqueUsers : 0
    const averageBookmarksPerPuzzle = uniquePuzzles > 0 ? totalBookmarks / uniquePuzzles : 0

    return {
      totalBookmarks,
      uniqueUsers,
      uniquePuzzles,
      averageBookmarksPerUser: Number.parseFloat(averageBookmarksPerUser.toFixed(2)),
      averageBookmarksPerPuzzle: Number.parseFloat(averageBookmarksPerPuzzle.toFixed(2)),
    }
  }

  async bulkRemoveBookmarks(userId: string, puzzleIds: string[]): Promise<number> {
    if (puzzleIds.length === 0) {
      return 0
    }

    const result = await this.bookmarkRepository
      .createQueryBuilder()
      .delete()
      .from(Bookmark)
      .where("userId = :userId", { userId })
      .andWhere("puzzleId IN (:...puzzleIds)", { puzzleIds })
      .execute()

    // Update puzzle bookmark counts
    for (const puzzleId of puzzleIds) {
      const puzzle = await this.puzzleRepository.findOne({
        where: { id: puzzleId },
      })
      if (puzzle && puzzle.bookmarkCount > 0) {
        await this.puzzleRepository.update(puzzleId, {
          bookmarkCount: Math.max(puzzle.bookmarkCount - 1, 0),
        })
      }
    }

    return result.affected || 0
  }
}
