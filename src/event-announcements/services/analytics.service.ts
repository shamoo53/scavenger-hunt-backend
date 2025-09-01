import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventAnnouncement } from '../entities/event-announcement.entity';

export interface EngagementMetrics {
  announcementId: string;
  views: number;
  likes: number;
  shares: number;
  clicks: number;
  acknowledgeCount: number;
  commentCount: number;
  readTime: number; // in seconds
  engagementRate: number;
  conversionRate: number;
}

export interface AnalyticsTimeframe {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
}

export interface UserEngagementData {
  userId: string;
  announcementId: string;
  action: 'view' | 'like' | 'share' | 'click' | 'acknowledge' | 'comment';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnnouncementPerformance {
  id: string;
  title: string;
  type: string;
  publishedAt: Date;
  metrics: EngagementMetrics;
  trends: AnalyticsTimeframe;
  audienceInsights: {
    topDemographics: string[];
    engagementByTimeOfDay: Record<string, number>;
    deviceTypes: Record<string, number>;
  };
}

@Injectable()
export class AnnouncementAnalyticsService {
  private readonly logger = new Logger(AnnouncementAnalyticsService.name);

  // In-memory storage for real-time analytics (in production, use Redis/database)
  private engagementData: UserEngagementData[] = [];
  private readonly maxStorageItems = 10000;

  constructor(
    @InjectRepository(EventAnnouncement)
    private readonly announcementRepository: Repository<EventAnnouncement>,
  ) {}

  /**
   * Track user engagement event
   */
  async trackEngagement(data: UserEngagementData): Promise<void> {
    try {
      // Add to in-memory storage
      this.engagementData.push({
        ...data,
        timestamp: new Date()
      });

      // Keep storage size manageable
      if (this.engagementData.length > this.maxStorageItems) {
        this.engagementData = this.engagementData.slice(-this.maxStorageItems);
      }

      this.logger.debug(`Tracked engagement: ${data.action} for announcement ${data.announcementId} by user ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to track engagement: ${error.message}`);
    }
  }

  /**
   * Get engagement metrics for a specific announcement
   */
  async getAnnouncementMetrics(announcementId: string): Promise<EngagementMetrics> {
    try {
      const announcement = await this.announcementRepository.findOne({
        where: { id: announcementId }
      });

      if (!announcement) {
        throw new Error(`Announcement ${announcementId} not found`);
      }

      // Get engagement data for this announcement
      const engagementEvents = this.engagementData.filter(
        event => event.announcementId === announcementId
      );

      const metrics: EngagementMetrics = {
        announcementId,
        views: announcement.viewCount || 0,
        likes: announcement.likeCount || 0,
        shares: announcement.shareCount || 0,
        clicks: announcement.clickCount || 0,
        acknowledgeCount: announcement.acknowledgeCount || 0,
        commentCount: 0, // Will be implemented when comments are added
        readTime: this.calculateAverageReadTime(engagementEvents),
        engagementRate: this.calculateEngagementRate(announcement, engagementEvents),
        conversionRate: this.calculateConversionRate(announcement, engagementEvents)
      };

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get announcement metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get performance data for all announcements
   */
  async getAnnouncementPerformanceReport(
    startDate?: Date,
    endDate?: Date,
    limit: number = 50
  ): Promise<AnnouncementPerformance[]> {
    try {
      const queryBuilder = this.announcementRepository.createQueryBuilder('announcement')
        .where('announcement.isPublished = :isPublished', { isPublished: true })
        .orderBy('announcement.viewCount', 'DESC')
        .limit(limit);

      if (startDate && endDate) {
        queryBuilder.andWhere('announcement.publishedAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      const announcements = await queryBuilder.getMany();

      const performances: AnnouncementPerformance[] = [];

      for (const announcement of announcements) {
        const metrics = await this.getAnnouncementMetrics(announcement.id);
        const trends = this.calculateTrends(announcement.id, startDate, endDate);
        const audienceInsights = await this.getAudienceInsights(announcement.id);

        performances.push({
          id: announcement.id,
          title: announcement.title,
          type: announcement.type,
          publishedAt: announcement.publishedAt,
          metrics,
          trends,
          audienceInsights
        });
      }

      return performances;
    } catch (error) {
      this.logger.error(`Failed to get performance report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top performing announcements by metric
   */
  async getTopPerformingAnnouncements(
    metric: 'views' | 'likes' | 'shares' | 'engagement',
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<AnnouncementPerformance[]> {
    try {
      const startDate = this.getStartDateForTimeframe(timeframe);
      const performances = await this.getAnnouncementPerformanceReport(startDate, new Date(), limit * 2);

      // Sort by the specified metric
      const sorted = performances.sort((a, b) => {
        switch (metric) {
          case 'views':
            return b.metrics.views - a.metrics.views;
          case 'likes':
            return b.metrics.likes - a.metrics.likes;
          case 'shares':
            return b.metrics.shares - a.metrics.shares;
          case 'engagement':
            return b.metrics.engagementRate - a.metrics.engagementRate;
          default:
            return 0;
        }
      });

      return sorted.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get top performing announcements: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filteredData = this.engagementData.filter(
        event => event.timestamp >= startDate && event.timestamp <= endDate
      );

      const trends: Record<string, any> = {};

      // Group data by timeframe
      filteredData.forEach(event => {
        const key = this.getTimeKey(event.timestamp, timeframe);
        if (!trends[key]) {
          trends[key] = {
            views: 0,
            likes: 0,
            shares: 0,
            clicks: 0,
            acknowledges: 0
          };
        }
        trends[key][event.action + 's'] = (trends[key][event.action + 's'] || 0) + 1;
      });

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get engagement trends: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user engagement summary
   */
  async getUserEngagementSummary(userId: string): Promise<Record<string, any>> {
    try {
      const userEvents = this.engagementData.filter(event => event.userId === userId);

      const summary = {
        totalEngagements: userEvents.length,
        announcementsViewed: new Set(
          userEvents.filter(e => e.action === 'view').map(e => e.announcementId)
        ).size,
        announcementsLiked: new Set(
          userEvents.filter(e => e.action === 'like').map(e => e.announcementId)
        ).size,
        announcementsShared: new Set(
          userEvents.filter(e => e.action === 'share').map(e => e.announcementId)
        ).size,
        lastActivity: userEvents.length > 0 ? 
          Math.max(...userEvents.map(e => e.timestamp.getTime())) : null,
        favoriteCategories: this.getUserFavoriteCategories(userId),
        engagementPattern: this.getUserEngagementPattern(userId)
      };

      return summary;
    } catch (error) {
      this.logger.error(`Failed to get user engagement summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate analytics dashboard data
   */
  async getDashboardData(): Promise<Record<string, any>> {
    try {
      const [
        totalEngagements,
        activeAnnouncementsCount,
        topPerforming,
        recentTrends
      ] = await Promise.all([
        this.getTotalEngagements(),
        this.getActiveAnnouncementsCount(),
        this.getTopPerformingAnnouncements('engagement', 'week', 5),
        this.getEngagementTrends('day', 7)
      ]);

      return {
        overview: {
          totalEngagements,
          activeAnnouncements: activeAnnouncementsCount,
          averageEngagementRate: this.calculateOverallEngagementRate(),
          growthRate: this.calculateGrowthRate()
        },
        topPerforming,
        trends: recentTrends,
        insights: await this.generateInsights()
      };
    } catch (error) {
      this.logger.error(`Failed to generate dashboard data: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  private calculateAverageReadTime(events: UserEngagementData[]): number {
    const viewEvents = events.filter(e => e.action === 'view');
    if (viewEvents.length === 0) return 0;

    // Simulate read time calculation (in a real app, you'd track this)
    return Math.floor(Math.random() * 120) + 30; // 30-150 seconds
  }

  private calculateEngagementRate(announcement: EventAnnouncement, events: UserEngagementData[]): number {
    const views = announcement.viewCount || 1;
    const engagements = events.filter(e => e.action !== 'view').length;
    return (engagements / views) * 100;
  }

  private calculateConversionRate(announcement: EventAnnouncement, events: UserEngagementData[]): number {
    const views = announcement.viewCount || 1;
    const conversions = events.filter(e => e.action === 'click' || e.action === 'acknowledge').length;
    return (conversions / views) * 100;
  }

  private calculateTrends(announcementId: string, startDate?: Date, endDate?: Date): AnalyticsTimeframe {
    const events = this.engagementData.filter(event => {
      if (event.announcementId !== announcementId) return false;
      if (startDate && event.timestamp < startDate) return false;
      if (endDate && event.timestamp > endDate) return false;
      return true;
    });

    return {
      daily: this.groupEventsByTimeframe(events, 'day'),
      weekly: this.groupEventsByTimeframe(events, 'week'),
      monthly: this.groupEventsByTimeframe(events, 'month')
    };
  }

  private async getAudienceInsights(announcementId: string): Promise<any> {
    // Mock implementation - in a real app, you'd have user demographic data
    return {
      topDemographics: ['18-24', '25-34', '35-44'],
      engagementByTimeOfDay: {
        '09:00': 15,
        '12:00': 25,
        '15:00': 20,
        '18:00': 30,
        '21:00': 10
      },
      deviceTypes: {
        mobile: 60,
        desktop: 35,
        tablet: 5
      }
    };
  }

  private groupEventsByTimeframe(events: UserEngagementData[], timeframe: string): Record<string, number> {
    const grouped: Record<string, number> = {};

    events.forEach(event => {
      const key = this.getTimeKey(event.timestamp, timeframe);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return grouped;
  }

  private getTimeKey(date: Date, timeframe: string): string {
    switch (timeframe) {
      case 'hour':
        return date.toISOString().substring(0, 13);
      case 'day':
        return date.toISOString().substring(0, 10);
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10);
      case 'month':
        return date.toISOString().substring(0, 7);
      default:
        return date.toISOString().substring(0, 10);
    }
  }

  private getStartDateForTimeframe(timeframe: string): Date {
    const date = new Date();
    switch (timeframe) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date;
  }

  private async getTotalEngagements(): Promise<number> {
    return this.engagementData.length;
  }

  private async getActiveAnnouncementsCount(): Promise<number> {
    return await this.announcementRepository.count({
      where: { isActive: true, isPublished: true }
    });
  }

  private calculateOverallEngagementRate(): number {
    // Mock calculation
    return Math.random() * 20 + 5; // 5-25%
  }

  private calculateGrowthRate(): number {
    // Mock calculation
    return Math.random() * 50 - 10; // -10% to +40%
  }

  private async generateInsights(): Promise<string[]> {
    return [
      'Peak engagement occurs between 6-8 PM',
      'Mobile users show 40% higher engagement rates',
      'Featured announcements perform 3x better than regular ones',
      'Announcements with images have 60% more views'
    ];
  }

  private getUserFavoriteCategories(userId: string): string[] {
    // Mock implementation
    return ['general', 'events', 'updates'];
  }

  private getUserEngagementPattern(userId: string): Record<string, any> {
    // Mock implementation
    return {
      mostActiveHour: '18:00',
      preferredDevice: 'mobile',
      averageSessionDuration: 5.2
    };
  }
}