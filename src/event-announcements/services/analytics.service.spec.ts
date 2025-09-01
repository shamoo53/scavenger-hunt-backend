import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnnouncementAnalyticsService,
  UserEngagementData,
} from './analytics.service';
import { EventAnnouncement } from '../entities/event-announcement.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
} from '../enums/announcement.enum';

describe('AnnouncementAnalyticsService', () => {
  let service: AnnouncementAnalyticsService;
  let repository: Repository<EventAnnouncement>;

  const mockRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementAnalyticsService,
        {
          provide: getRepositoryToken(EventAnnouncement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementAnalyticsService>(
      AnnouncementAnalyticsService,
    );
    repository = module.get<Repository<EventAnnouncement>>(
      getRepositoryToken(EventAnnouncement),
    );

    // Reset all mocks
    Object.values(mockRepository).forEach((mock) => mock.mockClear());
    Object.values(mockQueryBuilder).forEach((mock) => mock.mockClear());
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackEngagement', () => {
    it('should track user engagement event', async () => {
      const engagementData: UserEngagementData = {
        userId: 'user-123',
        announcementId: 'announcement-456',
        action: 'view',
        timestamp: new Date(),
        metadata: { device: 'mobile' },
      };

      await expect(
        service.trackEngagement(engagementData),
      ).resolves.not.toThrow();
    });

    it('should handle different engagement actions', async () => {
      const actions: Array<UserEngagementData['action']> = [
        'view',
        'like',
        'share',
        'click',
        'acknowledge',
        'comment',
      ];

      for (const action of actions) {
        const engagementData: UserEngagementData = {
          userId: 'user-123',
          announcementId: 'announcement-456',
          action,
          timestamp: new Date(),
        };

        await expect(
          service.trackEngagement(engagementData),
        ).resolves.not.toThrow();
      }
    });

    it('should handle tracking errors gracefully', async () => {
      const invalidData = {
        userId: '', // Invalid empty userId
        announcementId: 'announcement-456',
        action: 'view' as const,
        timestamp: new Date(),
      };

      await expect(service.trackEngagement(invalidData)).resolves.not.toThrow();
    });
  });

  describe('getAnnouncementMetrics', () => {
    it('should return metrics for existing announcement', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Announcement',
        viewCount: 100,
        likeCount: 25,
        shareCount: 10,
        clickCount: 15,
        acknowledgeCount: 5,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      const metrics = await service.getAnnouncementMetrics('announcement-123');

      expect(metrics).toEqual({
        announcementId: 'announcement-123',
        views: 100,
        likes: 25,
        shares: 10,
        clicks: 15,
        acknowledgeCount: 5,
        commentCount: 0,
        readTime: expect.any(Number),
        engagementRate: expect.any(Number),
        conversionRate: expect.any(Number),
      });
    });

    it('should throw error for non-existent announcement', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAnnouncementMetrics('non-existent'),
      ).rejects.toThrow('Announcement non-existent not found');
    });

    it('should handle announcements with zero metrics', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'New Announcement',
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      const metrics = await service.getAnnouncementMetrics('announcement-123');

      expect(metrics.views).toBe(0);
      expect(metrics.likes).toBe(0);
      expect(metrics.engagementRate).toBe(0);
    });
  });

  describe('getAnnouncementPerformanceReport', () => {
    it('should return performance report for announcements', async () => {
      const mockAnnouncements = [
        {
          id: 'announcement-1',
          title: 'Announcement 1',
          type: AnnouncementType.EVENT,
          publishedAt: new Date(),
          viewCount: 100,
          likeCount: 20,
        },
        {
          id: 'announcement-2',
          title: 'Announcement 2',
          type: AnnouncementType.GENERAL,
          publishedAt: new Date(),
          viewCount: 50,
          likeCount: 10,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockAnnouncements);
      mockRepository.findOne.mockImplementation((options) => {
        const id = options.where.id;
        return Promise.resolve(mockAnnouncements.find((a) => a.id === id));
      });

      const report = await service.getAnnouncementPerformanceReport(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        10,
      );

      expect(report).toHaveLength(2);
      expect(report[0]).toHaveProperty('id', 'announcement-1');
      expect(report[0]).toHaveProperty('metrics');
      expect(report[0]).toHaveProperty('trends');
      expect(report[0]).toHaveProperty('audienceInsights');
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const report = await service.getAnnouncementPerformanceReport();

      expect(report).toHaveLength(0);
    });

    it('should respect date filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getAnnouncementPerformanceReport(startDate, endDate, 25);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.publishedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('getTopPerformingAnnouncements', () => {
    it('should return top performing announcements by views', async () => {
      const mockPerformances = [
        {
          id: 'announcement-1',
          title: 'Top Announcement',
          type: AnnouncementType.EVENT,
          publishedAt: new Date(),
          metrics: {
            announcementId: 'announcement-1',
            views: 1000,
            likes: 100,
            shares: 50,
            clicks: 20,
            acknowledgeCount: 5,
            commentCount: 10,
            readTime: 120,
            engagementRate: 15,
            conversionRate: 2,
          },
          trends: { daily: {}, weekly: {}, monthly: {} },
          audienceInsights: {
            topDemographics: [],
            engagementByTimeOfDay: {},
            deviceTypes: {},
          },
        },
        {
          id: 'announcement-2',
          title: 'Second Announcement',
          type: AnnouncementType.GENERAL,
          publishedAt: new Date(),
          metrics: {
            announcementId: 'announcement-2',
            views: 500,
            likes: 50,
            shares: 25,
            clicks: 10,
            acknowledgeCount: 3,
            commentCount: 5,
            readTime: 90,
            engagementRate: 10,
            conversionRate: 1.5,
          },
          trends: { daily: {}, weekly: {}, monthly: {} },
          audienceInsights: {
            topDemographics: [],
            engagementByTimeOfDay: {},
            deviceTypes: {},
          },
        },
      ];

      jest
        .spyOn(service, 'getAnnouncementPerformanceReport')
        .mockResolvedValue(mockPerformances);

      const topPerforming = await service.getTopPerformingAnnouncements(
        'views',
        'week',
        5,
      );

      expect(topPerforming).toHaveLength(2);
      expect(topPerforming[0].metrics.views).toBeGreaterThan(
        topPerforming[1].metrics.views,
      );
    });

    it('should sort by different metrics', async () => {
      const mockPerformances = [
        {
          id: 'announcement-1',
          metrics: {
            announcementId: 'announcement-1',
            views: 100,
            likes: 50,
            shares: 25,
            clicks: 5,
            acknowledgeCount: 2,
            commentCount: 3,
            readTime: 60,
            engagementRate: 20,
            conversionRate: 1,
          },
        },
        {
          id: 'announcement-2',
          metrics: {
            announcementId: 'announcement-2',
            views: 200,
            likes: 30,
            shares: 40,
            clicks: 8,
            acknowledgeCount: 1,
            commentCount: 2,
            readTime: 80,
            engagementRate: 15,
            conversionRate: 1.2,
          },
        },
      ] as any;

      jest
        .spyOn(service, 'getAnnouncementPerformanceReport')
        .mockResolvedValue(mockPerformances);

      // Test sorting by likes
      const byLikes = await service.getTopPerformingAnnouncements(
        'likes',
        'week',
        5,
      );
      expect(byLikes[0].metrics.likes).toBeGreaterThan(
        byLikes[1].metrics.likes,
      );

      // Test sorting by engagement rate
      const byEngagement = await service.getTopPerformingAnnouncements(
        'engagement',
        'week',
        5,
      );
      expect(byEngagement[0].metrics.engagementRate).toBeGreaterThan(
        byEngagement[1].metrics.engagementRate,
      );
    });
  });

  describe('getEngagementTrends', () => {
    it('should return engagement trends for specified timeframe', async () => {
      const trends = await service.getEngagementTrends('day', 7);

      expect(trends).toBeDefined();
      expect(typeof trends).toBe('object');
    });

    it('should handle different timeframes', async () => {
      const timeframes: Array<'hour' | 'day' | 'week' | 'month'> = [
        'hour',
        'day',
        'week',
        'month',
      ];

      for (const timeframe of timeframes) {
        const trends = await service.getEngagementTrends(timeframe, 30);
        expect(trends).toBeDefined();
      }
    });

    it('should filter data by date range', async () => {
      const trends = await service.getEngagementTrends('day', 14);
      expect(trends).toBeDefined();
    });
  });

  describe('getUserEngagementSummary', () => {
    it('should return user engagement summary', async () => {
      const userId = 'user-123';

      // Track some engagement first
      await service.trackEngagement({
        userId,
        announcementId: 'announcement-1',
        action: 'view',
        timestamp: new Date(),
      });

      await service.trackEngagement({
        userId,
        announcementId: 'announcement-1',
        action: 'like',
        timestamp: new Date(),
      });

      const summary = await service.getUserEngagementSummary(userId);

      expect(summary).toHaveProperty('totalEngagements');
      expect(summary).toHaveProperty('announcementsViewed');
      expect(summary).toHaveProperty('announcementsLiked');
      expect(summary).toHaveProperty('announcementsShared');
      expect(summary).toHaveProperty('lastActivity');
      expect(summary).toHaveProperty('favoriteCategories');
      expect(summary).toHaveProperty('engagementPattern');
    });

    it('should handle users with no engagement', async () => {
      const summary =
        await service.getUserEngagementSummary('non-existent-user');

      expect(summary.totalEngagements).toBe(0);
      expect(summary.announcementsViewed).toBe(0);
      expect(summary.lastActivity).toBeNull();
    });
  });

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      mockRepository.count.mockResolvedValue(10);
      jest
        .spyOn(service, 'getTopPerformingAnnouncements')
        .mockResolvedValue([]);
      jest.spyOn(service, 'getEngagementTrends').mockResolvedValue({});

      const dashboardData = await service.getDashboardData();

      expect(dashboardData).toHaveProperty('overview');
      expect(dashboardData).toHaveProperty('topPerforming');
      expect(dashboardData).toHaveProperty('trends');
      expect(dashboardData).toHaveProperty('insights');

      expect(dashboardData.overview).toHaveProperty('totalEngagements');
      expect(dashboardData.overview).toHaveProperty('activeAnnouncements');
      expect(dashboardData.overview).toHaveProperty('averageEngagementRate');
      expect(dashboardData.overview).toHaveProperty('growthRate');
    });

    it('should handle errors in dashboard data generation', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardData()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Metrics Calculations', () => {
    it('should calculate engagement rate correctly', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        viewCount: 100,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      // Track some engagements
      await service.trackEngagement({
        userId: 'user-1',
        announcementId: 'announcement-123',
        action: 'like',
        timestamp: new Date(),
      });

      await service.trackEngagement({
        userId: 'user-2',
        announcementId: 'announcement-123',
        action: 'share',
        timestamp: new Date(),
      });

      const metrics = await service.getAnnouncementMetrics('announcement-123');

      expect(metrics.engagementRate).toBeDefined();
      expect(typeof metrics.engagementRate).toBe('number');
      expect(metrics.engagementRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate conversion rate correctly', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        viewCount: 100,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      const metrics = await service.getAnnouncementMetrics('announcement-123');

      expect(metrics.conversionRate).toBeDefined();
      expect(typeof metrics.conversionRate).toBe('number');
      expect(metrics.conversionRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate reading time', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        viewCount: 50,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      const metrics = await service.getAnnouncementMetrics('announcement-123');

      expect(metrics.readTime).toBeDefined();
      expect(typeof metrics.readTime).toBe('number');
      expect(metrics.readTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.getAnnouncementMetrics('announcement-123'),
      ).rejects.toThrow('Failed to get announcement metrics');
    });

    it('should handle invalid engagement data', async () => {
      const invalidData = {
        userId: null,
        announcementId: '',
        action: 'invalid-action',
        timestamp: 'invalid-date',
      } as any;

      await expect(service.trackEngagement(invalidData)).resolves.not.toThrow();
    });

    it('should handle repository errors in performance report', async () => {
      mockQueryBuilder.getMany.mockRejectedValue(new Error('Query failed'));

      await expect(service.getAnnouncementPerformanceReport()).rejects.toThrow(
        'Failed to get performance report',
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate engagement action types', async () => {
      const validActions = [
        'view',
        'like',
        'share',
        'click',
        'acknowledge',
        'comment',
      ];

      for (const action of validActions) {
        const data: UserEngagementData = {
          userId: 'user-123',
          announcementId: 'announcement-456',
          action: action as any,
          timestamp: new Date(),
        };

        await expect(service.trackEngagement(data)).resolves.not.toThrow();
      }
    });

    it('should handle missing optional metadata', async () => {
      const data: UserEngagementData = {
        userId: 'user-123',
        announcementId: 'announcement-456',
        action: 'view',
        timestamp: new Date(),
        // metadata is optional
      };

      await expect(service.trackEngagement(data)).resolves.not.toThrow();
    });
  });
});
