import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PuzzlesService } from './puzzles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifyPuzzleDto } from './dto/verify-puzzle.dto';

@ApiTags('Puzzles')
@ApiBearerAuth()
@Controller('puzzles')
export class PuzzlesController {
  constructor(private readonly puzzlesService: PuzzlesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @ApiOperation({ summary: 'Verify puzzle answer' })
  @ApiResponse({ status: 201, description: 'Puzzle solved successfully' })
  @ApiResponse({ status: 400, description: 'Wrong answer or already solved' })
  async verifyPuzzle(@Request() req, @Body() verifyPuzzleDto: VerifyPuzzleDto) {
    return this.puzzlesService.verifyPuzzle(req.user.id, verifyPuzzleDto);
  }
}
