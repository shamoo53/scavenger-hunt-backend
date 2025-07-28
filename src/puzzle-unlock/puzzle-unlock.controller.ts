import { Controller, Get, Post, Body, Param, Query, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { PuzzleUnlockService } from './puzzle-unlock.service';
import { CreateUnlockDto } from './dto/create-unlock.dto';
import { UnlockPuzzleDto } from './dto/unlock-puzzle.dto';
import { CreateUnlockRequirementDto } from './dto/create-unlock-requirement.dto';
import { UnlockStatus as UnlockStatusEnum } from './entities/unlock.entity';

@Controller('puzzle-unlock')
export class PuzzleUnlockController {
  constructor(private readonly puzzleUnlockService: PuzzleUnlockService) {}

  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  async unlockPuzzle(@Body() unlockDto: UnlockPuzzleDto) {
    return this.puzzleUnlockService.unlockPuzzle(unlockDto);
  }

  @Get('status/:userId/:puzzleId')
  async checkUnlockStatus(
    @Param('userId') userId: string,
    @Param('puzzleId') puzzleId: string
  ) {
    return this.puzzleUnlockService.checkUnlockStatus(userId, puzzleId);
  }

  @Post('requirements')
  async createUnlockRequirement(@Body() createDto: CreateUnlockRequirementDto) {
    return this.puzzleUnlockService.createUnlockRequirement(createDto);
  }

  @Get('requirements/:puzzleId')
  async getUnlockRequirements(@Param('puzzleId') puzzleId: string) {
    return this.puzzleUnlockService.getUnlockRequirements(puzzleId);
  }

  @Get('user/:userId')
  async getUserUnlocks(
    @Param('userId') userId: string,
    @Query('status') status?: UnlockStatusEnum
  ) {
    return this.puzzleUnlockService.getUserUnlocks(userId, status);
  }

  @Get('puzzle/:puzzleId')
  async getPuzzleUnlocks(@Param('puzzleId') puzzleId: string) {
    return this.puzzleUnlockService.getPuzzleUnlocks(puzzleId);
  }

  @Post('manual')
  async createManualUnlock(@Body() createDto: CreateUnlockDto) {
    return this.puzzleUnlockService.createUnlock(createDto);
  }

  @Patch(':unlockId/status')
  async updateUnlockStatus(
    @Param('unlockId') unlockId: string,
    @Body('status') status: UnlockStatusEnum
  ) {
    return this.puzzleUnlockService.updateUnlockStatus(unlockId, status);
  }
}
