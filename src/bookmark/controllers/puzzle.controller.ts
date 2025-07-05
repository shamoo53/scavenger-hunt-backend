import { Controller, Post, Get, Put, Delete, HttpCode, HttpStatus } from "@nestjs/common"
import type { PuzzleService } from "../services/puzzle.service"
import type { CreatePuzzleDto } from "../dto/create-puzzle.dto"
import type { PuzzleResponseDto } from "../dto/puzzle-response.dto"
import type { PaginationDto, PaginatedResponseDto } from "../dto/pagination.dto"
import type { PuzzleStatus } from "../entities/puzzle.entity"

@Controller("puzzles")
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPuzzle(createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
    return this.puzzleService.createPuzzle(createPuzzleDto)
  }

  @Get()
  async getAllPuzzles(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PuzzleResponseDto>> {
    const { page, limit } = paginationDto
    return this.puzzleService.getAllPuzzles(page, limit)
  }

  @Get("published")
  async getPublishedPuzzles(paginationDto: PaginationDto): Promise<PaginatedResponseDto<PuzzleResponseDto>> {
    const { page, limit } = paginationDto
    return this.puzzleService.getPublishedPuzzles(page, limit)
  }

  @Get(":id")
  async getPuzzleById(id: string): Promise<PuzzleResponseDto> {
    return this.puzzleService.getPuzzleById(id)
  }

  @Put(":id/status/:status")
  async updatePuzzleStatus(id: string, status: string): Promise<PuzzleResponseDto> {
    return this.puzzleService.updatePuzzleStatus(id, status as PuzzleStatus)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePuzzle(id: string): Promise<void> {
    return this.puzzleService.deletePuzzle(id)
  }
}
