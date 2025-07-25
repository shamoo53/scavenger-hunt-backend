import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ProgressQueryDto } from './dto/progress-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  create(@Request() req, @Body() createProgressDto: CreateProgressDto) {
    return this.progressService.create(req.user.id, createProgressDto);
  }

  @Get()
  findAll(@Request() req, @Query() query: ProgressQueryDto) {
    return this.progressService.findAll(req.user.id, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.progressService.getPlayerStats(req.user.id);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: number) {
    return this.progressService.getLeaderboard(limit);
  }

  @Get(':puzzleId')
  findOne(@Request() req, @Param('puzzleId') puzzleId: string) {
    return this.progressService.findOne(req.user.id, puzzleId);
  }

  @Patch(':puzzleId')
  update(
    @Request() req,
    @Param('puzzleId') puzzleId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.update(req.user.id, puzzleId, updateProgressDto);
  }

  @Patch(':puzzleId/attempt')
  incrementAttempts(@Request() req, @Param('puzzleId') puzzleId: string) {
    return this.progressService.incrementAttempts(req.user.id, puzzleId);
  }

  @Delete(':puzzleId')
  remove(@Request() req, @Param('puzzleId') puzzleId: string) {
    return this.progressService.remove(req.user.id, puzzleId);
  }
}