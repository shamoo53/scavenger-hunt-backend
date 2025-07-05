import { Injectable, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { Puzzle } from "../entities/puzzle.entity"
import { PuzzleStatus } from "../entities/puzzle.entity"
import type { CreatePuzzleDto } from "../dto/create-puzzle.dto"
import { PuzzleResponseDto } from "../dto/puzzle-response.dto"
import { PaginatedResponseDto } from "../dto/pagination.dto"

@Injectable()
export class PuzzleService {
  private readonly puzzleRepository: Repository<Puzzle>

  constructor(puzzleRepository: Repository<Puzzle>) {
    this.puzzleRepository = puzzleRepository
  }

  async createPuzzle(createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
    const { title, description, difficulty, status, categoryId, tags, content, solution, createdBy } = createPuzzleDto

    const puzzle = this.puzzleRepository.create({
      title,
      description: description || null,
      difficulty,
      status: status || PuzzleStatus.DRAFT,
      categoryId: categoryId || null,
      tags: tags || [],
      content: content || null,
      solution: solution || null,
      bookmarkCount: 0,
      solveCount: 0,
      createdBy,
    })

    const savedPuzzle = await this.puzzleRepository.save(puzzle)
    return new PuzzleResponseDto(savedPuzzle)
  }

  async getPuzzleById(puzzleId: string): Promise<PuzzleResponseDto> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    if (!puzzle) {
      throw new NotFoundException("Puzzle not found")
    }

    return new PuzzleResponseDto(puzzle)
  }

  async getAllPuzzles(page = 1, limit = 10): Promise<PaginatedResponseDto<PuzzleResponseDto>> {
    const offset = (page - 1) * limit

    const [puzzles, total] = await this.puzzleRepository.findAndCount({
      order: { createdAt: "DESC" },
      skip: offset,
      take: limit,
    })

    const puzzleResponses = puzzles.map((puzzle) => new PuzzleResponseDto(puzzle))
    return new PaginatedResponseDto<PuzzleResponseDto>(puzzleResponses, page, limit, total)
  }

  async getPublishedPuzzles(page = 1, limit = 10): Promise<PaginatedResponseDto<PuzzleResponseDto>> {
    const offset = (page - 1) * limit

    const [puzzles, total] = await this.puzzleRepository.findAndCount({
      where: { status: PuzzleStatus.PUBLISHED },
      order: { createdAt: "DESC" },
      skip: offset,
      take: limit,
    })

    const puzzleResponses = puzzles.map((puzzle) => new PuzzleResponseDto(puzzle))
    return new PaginatedResponseDto<PuzzleResponseDto>(puzzleResponses, page, limit, total)
  }

  async updatePuzzleStatus(puzzleId: string, status: PuzzleStatus): Promise<PuzzleResponseDto> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    if (!puzzle) {
      throw new NotFoundException("Puzzle not found")
    }

    puzzle.status = status
    const updatedPuzzle = await this.puzzleRepository.save(puzzle)

    return new PuzzleResponseDto(updatedPuzzle)
  }

  async deletePuzzle(puzzleId: string): Promise<void> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    })

    if (!puzzle) {
      throw new NotFoundException("Puzzle not found")
    }

    await this.puzzleRepository.remove(puzzle)
  }

  async updateBookmarkCount(puzzleId: string): Promise<void> {
    // This would typically be called by the bookmark service
    // but we'll implement it here for completeness
    const result = await this.puzzleRepository
      .createQueryBuilder()
      .update(Puzzle)
      .set({
        bookmarkCount: () => `(
          SELECT COUNT(*) 
          FROM puzzle_bookmarks 
          WHERE puzzle_bookmarks.puzzleId = :puzzleId
        )`,
      })
      .where("id = :puzzleId", { puzzleId })
      .execute()

    if (result.affected === 0) {
      throw new NotFoundException("Puzzle not found")
    }
  }
}
