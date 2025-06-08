import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ContributionService } from '../services/contribution.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { ReviewContributionDto } from '../dto/review-contribution.dto';
import { LeaderboardQueryDto } from '../dto/leaderboard-query.dto';

// @UseGuards(AdminGuard)
@Controller('admin/contributions')
export class AdminContributionController {
  constructor(
    private readonly contributionService: ContributionService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get('pending')
  getPendingContributions() {
    return this.contributionService.findPendingContributions();
  }

  @Patch(':id/review')
  reviewContribution(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() reviewDto: ReviewContributionDto,
  ) {
    return this.contributionService.reviewContribution(id, req.user.id, reviewDto);
  }

  @Get('stats')
  getAllStats() {
    return this.contributionService.getContributionStats();
  }
}