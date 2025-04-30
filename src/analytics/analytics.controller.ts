import { Controller, Get, Query } from "@nestjs/common"
import type { AnalyticsService } from "./analytics.service"

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {
    // Fixing the syntax error by removing decorators
  }

  @Get("dashboard")
  getDashboardStats(): Promise<any> {
    return this.analyticsService.getDashboardStats()
  }

  @Get("time-series")
  getTimeSeriesData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: 'day' | 'week' | 'month',
  ): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    return this.analyticsService.getTimeSeriesData(start, end, interval)
  }

  @Get("question-performance")
  getQuestionPerformanceStats(): Promise<any> {
    return this.analyticsService.getQuestionPerformanceStats()
  }

  @Get("player-engagement")
  getPlayerEngagementStats(): Promise<any> {
    return this.analyticsService.getPlayerEngagementStats()
  }
}
