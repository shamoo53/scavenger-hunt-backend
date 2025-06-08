import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ContributionService } from '../services/contribution.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { ReputationService } from '../services/reputation.service';
import { CreateContributionDto } from '../dto/create-contribution.dto';
import { ReviewContributionDto } from '../dto/review-contribution.dto';
import { LeaderboardQueryDto } from '../dto/leaderboard-query.dto';

// Assuming you have authentication guards
// @UseGuards(AuthGuard)
@Controller('contributions')
export class ContributionController {
  constructor(
    private readonly contributionService: ContributionService,
    private readonly leaderboardService: LeaderboardService,
    private readonly reputationService: ReputationService,
  ) {}

  @Post()
  create(@Request() req: any, @Body() createContributionDto: CreateContributionDto) {
    return this.contributionService.create(req.user.id, createContributionDto);
  }

  @Get('my-contributions')
  getMyContributions(@Request() req: any) {
    return this.contributionService.findUserContributions(req.user.id);
  }

  @Get('my-reputation-history')
  getMyReputationHistory(@Request() req: any) {
    return this.reputationService.getUserReputationHistory(req.user.id);
  }

  @Get('stats')
  getMyStats(@Request() req: any) {
    return this.contributionService.getContributionStats(req.user.id);
  }
}