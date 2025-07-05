import type { PuzzleDifficulty, PuzzleStatus } from "../entities/puzzle.entity"

export class UserBookmarkResponseDto {
  id: string
  puzzleId: string
  puzzleTitle: string
  puzzleDescription: string | null
  puzzleDifficulty: PuzzleDifficulty
  puzzleStatus: PuzzleStatus
  puzzleCategoryId: string | null
  puzzleTags: string[]
  puzzleBookmarkCount: number
  puzzleSolveCount: number
  puzzleCreatedBy: string
  bookmarkedAt: Date

  constructor(bookmark: any, puzzle: any) {
    this.id = bookmark.id
    this.puzzleId = bookmark.puzzleId
    this.puzzleTitle = puzzle.title
    this.puzzleDescription = puzzle.description
    this.puzzleDifficulty = puzzle.difficulty
    this.puzzleStatus = puzzle.status
    this.puzzleCategoryId = puzzle.categoryId
    this.puzzleTags = puzzle.tags || []
    this.puzzleBookmarkCount = puzzle.bookmarkCount
    this.puzzleSolveCount = puzzle.solveCount
    this.puzzleCreatedBy = puzzle.createdBy
    this.bookmarkedAt = bookmark.createdAt
  }
}
