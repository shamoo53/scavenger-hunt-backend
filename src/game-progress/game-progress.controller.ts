import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GameProgressService } from './game-progress.service';
import { GameProgressResponseDto } from './dto/game-progress-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
}