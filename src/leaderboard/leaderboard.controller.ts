import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from "@nestjs/common"
import type { LeaderboardService } from "./leaderboard.service"
import type { CreateLeaderboardEntryDto } from "./dto/create-leaderboard-entry.dto"
import type { UpdateLeaderboardEntryDto } from "./dto/update-leaderboard-entry.dto"
import type { LeaderboardEntry } from "./leaderboard.entity"
import type { LeaderboardFilterDto } from "./dto/leaderboard-filter.dto"
import type { LeaderboardStatsDto } from "./dto/leaderboard-stats.dto"
import type { PaginatedResult } from "../common/interfaces/paginated-result.interface"

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createLeaderboardEntryDto: CreateLeaderboardEntryDto,
  ): Promise<LeaderboardEntry> {
    return this.leaderboardService.create(createLeaderboardEntryDto);
  }

  @Get()
  findAll(
    @Query() filterDto: LeaderboardFilterDto,
  ): Promise<PaginatedResult<LeaderboardEntry>> {
    return this.leaderboardService.findAll(filterDto);
  }

  @Get('stats')
  getLeaderboardStats(@Query() statsDto: LeaderboardStatsDto): Promise<any> {
    return this.leaderboardService.getLeaderboardStats(statsDto);
  }

  @Get("regions")
  getRegions(): Promise<string[]> {
    return this.leaderboardService.getRegions()
  }

  @Get("platforms")
  getPlatforms(): Promise<string[]> {
    return this.leaderboardService.getPlatforms()
  }

  @Get('weekly')
  getWeeklyLeaderboard(@Query('gameId') gameId?: string): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getWeeklyLeaderboard(gameId);
  }

  @Get('monthly')
  getMonthlyLeaderboard(@Query('gameId') gameId?: string): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getMonthlyLeaderboard(gameId);
  }

  @Get("search")
  searchPlayers(@Query('query') query: string, @Query('limit') limit?: number): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.searchPlayers(query, limit)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LeaderboardEntry> {
    return this.leaderboardService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaderboardEntryDto: UpdateLeaderboardEntryDto,
  ): Promise<LeaderboardEntry> {
    return this.leaderboardService.update(id, updateLeaderboardEntryDto)
  }

  @Patch(":id/playtime")
  updatePlayTime(
    @Param('id', ParseIntPipe) id: number,
    @Body('playTimeInSeconds', ParseIntPipe) playTimeInSeconds: number,
  ): Promise<LeaderboardEntry> {
    return this.leaderboardService.updatePlayTime(id, playTimeInSeconds)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.leaderboardService.remove(id);
  }

  @Get("game/:gameId")
  getTopScoresByGame(@Param('gameId') gameId: string, @Query('limit') limit?: number): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getTopScoresByGame(gameId, limit)
  }

  @Get('player/:playerName/highscore')
  getPlayerHighScore(@Param('playerName') playerName: string): Promise<LeaderboardEntry | null> {
    return this.leaderboardService.getPlayerHighScore(playerName);
  }

  @Get("player/:playerName/history")
  getPlayerHistory(
    @Param('playerName') playerName: string,
    @Query('limit') limit?: number,
  ): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getPlayerHistory(playerName, limit)
  }

  @Get('player/:playerName/progress')
  getPlayerProgress(@Param('playerName') playerName: string): Promise<any> {
    return this.leaderboardService.getPlayerProgress(playerName);
  }
}
