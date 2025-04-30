import { Controller, Get, UseGuards, Req, BadRequestException, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GameProgressService } from './game-progress.service';
import { GameProgressResponseDto } from './dto/game-progress-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { SingleGameProgressResponseDto } from './dto/single-game-progress-response.dto';

@ApiTags('game-progress')
@Controller('game-progress')
export class GameProgressController {
  constructor(private readonly gameProgressService: GameProgressService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user game progress across all games' })
  @ApiResponse({ 
    status: 200, 
    description: 'User game progress successfully retrieved',
    type: GameProgressResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserGameProgress(@Req() req: Request): Promise<GameProgressResponseDto> {
    const userId = req.user['id'];
    return this.gameProgressService.getUserGameProgress(userId);
  }

  @Get(':gameId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress for a specific game' })
  @ApiParam({ name: 'gameId', type: 'number', description: 'ID of the game' })
  @ApiResponse({ 
    status: 200, 
    description: 'User game progress successfully retrieved for the specified game',
    type: SingleGameProgressResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  @ApiResponse({ status: 400, description: 'Invalid game ID' })
  async getUserProgressForGame(
    @Req() req: Request,
    @Param('gameId', ParseIntPipe) gameId: number
  ): Promise<SingleGameProgressResponseDto> {
    try {
      const userId = req.user['id'];
      return await this.gameProgressService.getUserProgressForGame(userId, gameId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request or game ID');
    }
  }
}