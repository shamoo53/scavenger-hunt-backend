import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnnouncementAnalyticsService, UserEngagementData } from '../services/analytics.service';

@Controller('announcement-analytics')
export class AnnouncementAnalyticsController {
  constructor(
    private readonly analyticsService: AnnouncementAnalyticsService,
  ) {}

  @Post('track')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEngagement(@Body() engagementData: UserEngagementData) {
    return await this.analyticsService.trackEngagement(engagementData);
  }

  @Get('announcement/:id/metrics')
  async getAnnouncementMetrics(@Param('id', ParseUUIDPipe) id: string) {
    return await this.analyticsService.getAnnouncementMetrics(id);
  }

  @Get('performance-report')
  async getPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', ParseIntPipe) limit: number = 50
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return await this.analyticsService.getAnnouncementPerformanceReport(start, end, limit);
  }

  @Get('top-performing')
  async getTopPerforming(
    @Query('metric') metric: 'views' | 'likes' | 'shares' | 'engagement' = 'engagement',
    @Query('timeframe') timeframe: 'day' | 'week' | 'month' = 'week',
    @Query('limit', ParseIntPipe) limit: number = 10
  ) {
    return await this.analyticsService.getTopPerformingAnnouncements(metric, timeframe, limit);
  }

  @Get('trends')
  async getEngagementTrends(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    @Query('days', ParseIntPipe) days: number = 30
  ) {
    return await this.analyticsService.getEngagementTrends(timeframe, days);
  }

  @Get('user/:userId/summary')
  async getUserEngagementSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.analyticsService.getUserEngagementSummary(userId);
  }

  @Get('dashboard')
  async getDashboardData() {
    return await this.analyticsService.getDashboardData();
  }
}