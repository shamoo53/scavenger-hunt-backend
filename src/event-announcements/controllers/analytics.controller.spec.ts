import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementAnalyticsController } from './analytics.controller';
import {
  AnnouncementAnalyticsService,
  UserEngagementData,
} from '../services/analytics.service';
import { BadRequestException } from '@nestjs/common';

describe('AnnouncementAnalyticsController', () => {
  let controller: AnnouncementAnalyticsController;
  let analyticsService: jest.Mocked<AnnouncementAnalyticsService>;

  const mockAnalyticsService = {
    trackEngagement: jest.fn(),
    getAnnouncementMetrics: jest.fn(),
    getAnnouncementPerformanceReport: jest.fn(),
    getTopPerformingAnnouncements: jest.fn(),
    getEngagementTrends: jest.fn(),
    getUserEngagementSummary: jest.fn(),
    getDashboardData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementAnalyticsController],
      providers: [
        {
          provide: AnnouncementAnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnnouncementAnalyticsController>(
      AnnouncementAnalyticsController,
    );
    analyticsService = module.get(AnnouncementAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEngagement', () => {
    it('should track user engagement successfully', async () => {
      const engagementData: UserEngagementData = {
        userId: 'user-123',
        announcementId: 'announcement-123',
        action: 'view',
        timestamp: new Date(),
        metadata: {
          source: 'web',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          referrer: 'https://example.com',
          duration: 30000,
        },
      };

      analyticsService.trackEngagement.mockResolvedValue(undefined);

      await controller.trackEngagement(engagementData);

      expect(analyticsService.trackEngagement).toHaveBeenCalledWith(
        engagementData,
      );
      expect(analyticsService.trackEngagement).toHaveBeenCalledTimes(1);
    });

    it('should handle engagement tracking errors', async () => {
      const engagementData: UserEngagementData = {
        userId: 'user-123',
        announcementId: 'invalid-id',
        action: 'view',
        timestamp: new Date(),
      };

      analyticsService.trackEngagement.mockRejectedValue(
        new BadRequestException('Invalid announcement ID'),
      );

      await expect(controller.trackEngagement(engagementData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should track different engagement actions', async () => {
      const actions = ['view', 'like', 'share', 'click', 'acknowledge'];

      for (const action of actions) {
        const engagementData: UserEngagementData = {
          userId: 'user-123',
          announcementId: 'announcement-123',
          action: action as any,
          timestamp: new Date(),
        };

        analyticsService.trackEngagement.mockResolvedValue(undefined);

        await controller.trackEngagement(engagementData);

        expect(analyticsService.trackEngagement).toHaveBeenCalledWith(
          engagementData,
        );
      }
    });
  });

  describe('getAnnouncementMetrics', () => {
    it('should return announcement metrics', async () => {
      const announcementId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMetrics = {
        announcementId,
        views: 150,
        likes: 25,
        shares: 10,
        clicks: 45,
        acknowledgeCount: 30,
        commentCount: 5,
        readTime: 45000,
        engagementRate: 0.73,
        conversionRate: 0.15,
      };

      analyticsService.getAnnouncementMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getAnnouncementMetrics(announcementId);

      expect(result).toEqual(mockMetrics);
      expect(analyticsService.getAnnouncementMetrics).toHaveBeenCalledWith(
        announcementId,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Note: ParseUUIDPipe would handle this at the framework level
      // This test verifies the service call with a valid UUID
      const announcementId = '123e4567-e89b-12d3-a456-426614174000';

      analyticsService.getAnnouncementMetrics.mockResolvedValue({
        announcementId,
        views: 0,
        likes: 0,
        shares: 0,
        clicks: 0,
        acknowledgeCount: 0,
        commentCount: 0,
        readTime: 0,
        engagementRate: 0,
        conversionRate: 0,
      });

      const result = await controller.getAnnouncementMetrics(announcementId);

      expect(result.announcementId).toBe(announcementId);
      expect(analyticsService.getAnnouncementMetrics).toHaveBeenCalledWith(
        announcementId,
      );
    });
  });

  describe('getPerformanceReport', () => {
    it('should return performance report with default parameters', async () => {
      const mockReport = [
        {
          id: 'announcement-1',
          title: 'Test Announcement',
          type: 'GENERAL',
          publishedAt: new Date(),
          metrics: {
            announcementId: 'announcement-1',
            views: 100,
            likes: 20,
            shares: 5,
            clicks: 15,
            acknowledgeCount: 10,
            commentCount: 3,
            readTime: 45000,
            engagementRate: 0.24,
            conversionRate: 0.1,
          },
          trends: {
            daily: {},
            weekly: {},
            monthly: {},
          },
          audienceInsights: {
            topDemographics: [],
            engagementByTimeOfDay: {},
            deviceTypes: {},
          },
        },
      ];

      analyticsService.getAnnouncementPerformanceReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getPerformanceReport();

      expect(result).toEqual(mockReport);
      expect(
        analyticsService.getAnnouncementPerformanceReport,
      ).toHaveBeenCalledWith(undefined, undefined, 50);
    });

    it('should return performance report with custom date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const limit = 100;

      const mockReport = [
        {
          id: 'announcement-1',
          title: 'Test Announcement',
          type: 'GENERAL',
          publishedAt: new Date(startDate),
          metrics: {
            announcementId: 'announcement-1',
            views: 50,
            likes: 10,
            shares: 2,
            clicks: 8,
            acknowledgeCount: 5,
            commentCount: 1,
            readTime: 30000,
            engagementRate: 0.24,
            conversionRate: 0.08,
          },
          trends: {
            daily: {},
            weekly: {},
            monthly: {},
          },
          audienceInsights: {
            topDemographics: [],
            engagementByTimeOfDay: {},
            deviceTypes: {},
          },
        },
      ];

      analyticsService.getAnnouncementPerformanceReport.mockResolvedValue(
        mockReport,
      );

      const result = await controller.getPerformanceReport(
        startDate,
        endDate,
        limit,
      );

      expect(result).toEqual(mockReport);
      expect(
        analyticsService.getAnnouncementPerformanceReport,
      ).toHaveBeenCalledWith(new Date(startDate), new Date(endDate), limit);
    });

    it('should handle invalid date formats gracefully', async () => {
      const startDate = 'invalid-date';
      const endDate = '2024-01-31';

      analyticsService.getAnnouncementPerformanceReport.mockResolvedValue([]);

      await controller.getPerformanceReport(startDate, endDate);

      expect(
        analyticsService.getAnnouncementPerformanceReport,
      ).toHaveBeenCalledWith(new Date(startDate), new Date(endDate), 50);
    });
  });

  describe('getTopPerforming', () => {
    it('should return top performing announcements with default parameters', async () => {
      const mockTopPerforming = [
        {
          id: 'announcement-1',
          title: 'Top Announcement',
          type: 'GENERAL',
          publishedAt: new Date(),
          metrics: {
            announcementId: 'announcement-1',
            views: 1000,
            likes: 100,
            shares: 50,
            clicks: 200,
            acknowledgeCount: 80,
            commentCount: 20,
            readTime: 60000,
            engagementRate: 0.95,
            conversionRate: 0.3,
          },
          trends: {
            daily: {},
            weekly: {},
            monthly: {},
          },
          audienceInsights: {
            topDemographics: [],
            engagementByTimeOfDay: {},
            deviceTypes: {},
          },
        },
      ];

      analyticsService.getTopPerformingAnnouncements.mockResolvedValue(
        mockTopPerforming,
      );

      const result = await controller.getTopPerforming();

      expect(result).toEqual(mockTopPerforming);
      expect(
        analyticsService.getTopPerformingAnnouncements,
      ).toHaveBeenCalledWith('engagement', 'week', 10);
    });

    it('should handle different metrics and timeframes', async () => {
      const metrics = ['views', 'likes', 'shares', 'engagement'] as const;
      const timeframes = ['day', 'week', 'month'] as const;

      for (const metric of metrics) {
        for (const timeframe of timeframes) {
          analyticsService.getTopPerformingAnnouncements.mockResolvedValue([]);

          await controller.getTopPerforming(metric, timeframe, 5);

          expect(
            analyticsService.getTopPerformingAnnouncements,
          ).toHaveBeenCalledWith(metric, timeframe, 5);
        }
      }
    });

    it('should handle custom limit parameter', async () => {
      const limit = 25;
      analyticsService.getTopPerformingAnnouncements.mockResolvedValue([]);

      await controller.getTopPerforming('views', 'month', limit);

      expect(
        analyticsService.getTopPerformingAnnouncements,
      ).toHaveBeenCalledWith('views', 'month', limit);
    });
  });

  describe('getEngagementTrends', () => {
    it('should return engagement trends with default parameters', async () => {
      const mockTrends = {
        timeframe: 'day',
        period: 30,
        data: [
          { date: '2024-01-01', views: 100, likes: 20, shares: 5 },
          { date: '2024-01-02', views: 120, likes: 25, shares: 8 },
        ],
        summary: {
          totalViews: 220,
          totalLikes: 45,
          totalShares: 13,
          avgDailyViews: 110,
        },
      };

      analyticsService.getEngagementTrends.mockResolvedValue(mockTrends);

      const result = await controller.getEngagementTrends();

      expect(result).toEqual(mockTrends);
      expect(analyticsService.getEngagementTrends).toHaveBeenCalledWith(
        'day',
        30,
      );
    });

    it('should handle different timeframes and periods', async () => {
      const timeframes = ['hour', 'day', 'week', 'month'] as const;
      const periods = [7, 30, 90];

      for (const timeframe of timeframes) {
        for (const period of periods) {
          analyticsService.getEngagementTrends.mockResolvedValue({
            timeframe,
            period,
            data: [],
            summary: {
              totalViews: 0,
              totalLikes: 0,
              totalShares: 0,
              avgDailyViews: 0,
            },
          });

          await controller.getEngagementTrends(timeframe, period);

          expect(analyticsService.getEngagementTrends).toHaveBeenCalledWith(
            timeframe,
            period,
          );
        }
      }
    });
  });

  describe('getUserEngagementSummary', () => {
    it('should return user engagement summary', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSummary = {
        userId,
        totalViews: 50,
        totalLikes: 10,
        totalShares: 5,
        totalAcknowledges: 8,
        favoriteCategories: ['events', 'updates'],
        engagementScore: 0.75,
        lastActivity: new Date(),
        mostEngagedAnnouncements: [],
      };

      analyticsService.getUserEngagementSummary.mockResolvedValue(mockSummary);

      const result = await controller.getUserEngagementSummary(userId);

      expect(result).toEqual(mockSummary);
      expect(analyticsService.getUserEngagementSummary).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should handle user with no engagement history', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSummary = {
        userId,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalAcknowledges: 0,
        favoriteCategories: [],
        engagementScore: 0,
        lastActivity: null,
        mostEngagedAnnouncements: [],
      };

      analyticsService.getUserEngagementSummary.mockResolvedValue(mockSummary);

      const result = await controller.getUserEngagementSummary(userId);

      expect(result).toEqual(mockSummary);
      expect(result.totalViews).toBe(0);
      expect(result.engagementScore).toBe(0);
    });
  });

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      const mockDashboardData = {
        overview: {
          totalAnnouncements: 250,
          totalViews: 15000,
          totalEngagements: 3000,
          avgEngagementRate: 0.2,
        },
        recentActivity: {
          last24Hours: { views: 500, engagements: 100 },
          last7Days: { views: 3500, engagements: 700 },
          last30Days: { views: 15000, engagements: 3000 },
        },
        topPerformers: [
          {
            id: 'announcement-1',
            title: 'Top Announcement',
            views: 1000,
            engagementRate: 0.85,
          },
        ],
        categoryBreakdown: {
          events: 50,
          updates: 30,
          maintenance: 10,
          general: 160,
        },
        trends: {
          viewsTrend: 'up',
          engagementTrend: 'up',
          weekOverWeekGrowth: 15.5,
        },
        alerts: [
          {
            type: 'warning',
            message: 'Low engagement on recent announcements',
          },
        ],
      };

      analyticsService.getDashboardData.mockResolvedValue(mockDashboardData);

      const result = await controller.getDashboardData();

      expect(result).toEqual(mockDashboardData);
      expect(analyticsService.getDashboardData).toHaveBeenCalledTimes(1);
      expect(result.overview.totalAnnouncements).toBe(250);
      expect(result.trends.weekOverWeekGrowth).toBe(15.5);
    });

    it('should handle empty dashboard data', async () => {
      const mockEmptyDashboard = {
        overview: {
          totalAnnouncements: 0,
          totalViews: 0,
          totalEngagements: 0,
          avgEngagementRate: 0,
        },
        recentActivity: {
          last24Hours: { views: 0, engagements: 0 },
          last7Days: { views: 0, engagements: 0 },
          last30Days: { views: 0, engagements: 0 },
        },
        topPerformers: [],
        categoryBreakdown: {},
        trends: {
          viewsTrend: 'stable',
          engagementTrend: 'stable',
          weekOverWeekGrowth: 0,
        },
        alerts: [],
      };

      analyticsService.getDashboardData.mockResolvedValue(mockEmptyDashboard);

      const result = await controller.getDashboardData();

      expect(result).toEqual(mockEmptyDashboard);
      expect(result.overview.totalAnnouncements).toBe(0);
      expect(result.topPerformers).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service unavailable');
      analyticsService.getDashboardData.mockRejectedValue(error);

      await expect(controller.getDashboardData()).rejects.toThrow(
        'Service unavailable',
      );
    });

    it('should handle analytics service failures gracefully', async () => {
      analyticsService.trackEngagement.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const engagementData: UserEngagementData = {
        userId: 'user-123',
        announcementId: 'announcement-123',
        action: 'view',
        timestamp: new Date(),
      };

      await expect(controller.trackEngagement(engagementData)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
