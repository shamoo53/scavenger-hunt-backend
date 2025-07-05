import type { PuzzleDifficulty, PuzzleStatus } from "../entities/puzzle.entity"

export class PuzzleResponseDto {
  id: string
  title: string
  description: string | null
  difficulty: PuzzleDifficulty
  status: PuzzleStatus
  categoryId: string | null
  tags: string[]
  content: any
  solution: any
  bookmarkCount: number
  solveCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date

  constructor(puzzle: any) {
    this.id = puzzle.id
    this.title = puzzle.title
    this.description = puzzle.description
    this.difficulty = puzzle.difficulty
    this.status = puzzle.status
    this.categoryId = puzzle.categoryId
    this.tags = puzzle.tags || []
    this.content = puzzle.content
    this.solution = puzzle.solution
    this.bookmarkCount = puzzle.bookmarkCount
    this.solveCount = puzzle.solveCount
    this.createdBy = puzzle.createdBy
    this.createdAt = puzzle.createdAt
    this.updatedAt = puzzle.updatedAt
  }
}
