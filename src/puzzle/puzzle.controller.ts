import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { PuzzleService } from "./puzzle.service";
import { CreatePuzzleDto } from "src/bookmark/dto/create-puzzle.dto";

@UseGuards(RolesGuard)
@Controller('admin/puzzles')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Post()
  create(@Body() dto: CreatePuzzleDto) {
    return this.puzzleService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdatePuzzleDto) {
    return this.puzzleService.update(id, dto);
  }

  @Get('analytics')
  getAnalytics() {
    return this.puzzleService.getAnalytics();
  }
}