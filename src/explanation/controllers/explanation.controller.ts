import { Controller, Post, Get, Put, Delete, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common"
import type { ExplanationService } from "../services/explanation.service"
import type { CreateExplanationDto } from "../dto/create-explanation.dto"
import type { UpdateExplanationDto } from "../dto/update-explanation.dto"
import type { ExplanationResponseDto } from "../dto/explanation-response.dto"
import { AdminGuard } from "../guards/admin.guard"

@Controller("puzzle-explanations")
export class ExplanationController {
  constructor(private readonly explanationService: ExplanationService) {}

  @Get("puzzle/:puzzleId")
  async getExplanationForUser(puzzleId: string, @Query('userId') userId: string): Promise<ExplanationResponseDto> {
    return this.explanationService.getExplanationForUser(puzzleId, userId)
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createExplanation(createExplanationDto: CreateExplanationDto): Promise<ExplanationResponseDto> {
    return this.explanationService.createExplanation(createExplanationDto)
  }

  @Put("puzzle/:puzzleId")
  @UseGuards(AdminGuard)
  async updateExplanation(
    puzzleId: string,
    updateExplanationDto: UpdateExplanationDto,
  ): Promise<ExplanationResponseDto> {
    return this.explanationService.updateExplanation(puzzleId, updateExplanationDto)
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllExplanations(): Promise<ExplanationResponseDto[]> {
    return this.explanationService.getAllExplanations()
  }

  @Get(":id")
  @UseGuards(AdminGuard)
  async getExplanationById(explanationId: string): Promise<ExplanationResponseDto> {
    return this.explanationService.getExplanationById(explanationId)
  }

  @Delete("puzzle/:puzzleId")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExplanation(puzzleId: string): Promise<void> {
    return this.explanationService.deleteExplanation(puzzleId)
  }
}
