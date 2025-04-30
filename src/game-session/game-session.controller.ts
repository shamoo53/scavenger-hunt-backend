import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, HttpStatus, HttpCode, Patch } from "@nestjs/common"
import type { GameSessionService } from "./game-session.service"
import type { CreateGameSessionDto } from "./dto/create-game-session.dto"
import type { AnswerQuestionDto } from "./dto/answer-question.dto"
import type { GameSessionFilterDto } from "./dto/game-session-filter.dto"
import type { GameSession } from "./game-session.entity"
import type { PaginatedResult } from "../common/interfaces/paginated-result.interface"

@Controller("game-sessions")
export class GameSessionController {
  constructor(private readonly gameSessionService: GameSessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGameSessionDto: CreateGameSessionDto): Promise<GameSession> {
    return this.gameSessionService.create(createGameSessionDto);
  }

  @Get()
  findAll(@Query() filterDto: GameSessionFilterDto): Promise<PaginatedResult<GameSession>> {
    return this.gameSessionService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<GameSession> {
    return this.gameSessionService.findOne(id);
  }

  @Get(':id/current-question')
  getCurrentQuestion(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.gameSessionService.getCurrentQuestion(id);
  }

  @Post(":id/answer")
  answerQuestion(@Param('id', ParseIntPipe) id: number, @Body() answerDto: AnswerQuestionDto): Promise<any> {
    return this.gameSessionService.answerQuestion(id, answerDto)
  }

  @Patch(':id/abandon')
  abandonSession(@Param('id', ParseIntPipe) id: number): Promise<GameSession> {
    return this.gameSessionService.abandonSession(id);
  }

  @Get(':id/results')
  getSessionResults(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.gameSessionService.getSessionResults(id);
  }

  @Get('player/:playerId/stats')
  getPlayerStats(@Param('playerId') playerId: string): Promise<any> {
    return this.gameSessionService.getPlayerStats(playerId);
  }

  @Get('game/:gameId/stats')
  getGameStats(@Param('gameId') gameId: string): Promise<any> {
    return this.gameSessionService.getGameStats(gameId);
  }
}
