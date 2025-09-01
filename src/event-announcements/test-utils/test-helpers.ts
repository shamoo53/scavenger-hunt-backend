import { Repository } from 'typeorm';
import { EventAnnouncement } from '../entities/event-announcement.entity';
import { AnnouncementTemplate, TemplateCategory } from '../entities/announcement-template.entity';
import { CreateEventAnnouncementDto } from '../dto/create-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../enums/announcement.enum';
import { UserEngagementData } from '../services/analytics.service';

/**
 * Test data factory for creating mock announcements
 */
export class AnnouncementTestDataFactory {
  static createMockAnnouncement(overrides: Partial<EventAnnouncement> = {}): EventAnnouncement {
    const defaultAnnouncement: EventAnnouncement = {
      id: 'test-announcement-' + Date.now(),
      title: 'Test Announcement',
      content: 'This is a test announcement with sufficient content length for validation purposes.',
      summary: 'Test announcement summary',
      type: AnnouncementType.GENERAL,
      priority: AnnouncementPriority.NORMAL,
      status: AnnouncementStatus.PUBLISHED,
      isActive: true,
      isPinned: false,
      isFeatured: false,
      requiresAcknowledgment: false,
      isPublished: true,
      allowComments: true,
      notifyUsers: false,
      category: 'test',
      author: 'Test Author',
      slug: 'test-announcement',
      targetAudience: ['all'],
      tags: ['test'],
      categories: ['testing'],
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      clickCount: 0,
      acknowledgeCount: 0,
      currentParticipants: 0,
      readingTimeMinutes: 1,
      sendNotification: true,
      sendEmail: false,
      sendPush: false,
      showInDashboard: true,
      showInApp: true,
      createdBy: '123e4567-e89b-12d3-a456-426614174000',
      createdByName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      publishedAt: new Date(),
      ...overrides,
    };

    return defaultAnnouncement;
  }

  static createMockAnnouncementDto(overrides: Partial<CreateEventAnnouncementDto> = {}): CreateEventAnnouncementDto {
    return {
      title: 'Test Announcement DTO',
      content: 'This is a test announcement DTO with sufficient content length for validation purposes.',
      type: AnnouncementType.GENERAL,
      priority: AnnouncementPriority.NORMAL,
      status: AnnouncementStatus.PUBLISHED,
      isActive: true,
      isPublished: true,
      createdBy: '123e4567-e89b-12d3-a456-426614174000',
      ...overrides,
    };
  }

  static createMockTemplate(overrides: Partial<AnnouncementTemplate> = {}): AnnouncementTemplate {
    return {
      id: 'test-template-' + Date.now(),
      name: 'Test Template',
      description: 'A test template for validation',
      category: TemplateCategory.EVENT,
      type: AnnouncementType.EVENT,
      priority: AnnouncementPriority.NORMAL,
      titleTemplate: 'Event: {{eventName}}',
      contentTemplate: 'Join us for {{eventName}} on {{eventDate}} at {{location}}.',
      variables: {
        eventName: { type: 'string', required: true, description: 'Name of the event' },
        eventDate: { type: 'date', required: true, description: 'Event date' },
        location: { type: 'string', required: true, description: 'Event location' },
      },
      defaultSettings: {
        isActive: true,
        isFeatured: true,
        notifyUsers: true,
        targetAudience: ['all'],
      },
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
      isActive: true,
      isSystem: false,
      usageCount: 0,
      tags: ['event', 'template'],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockEngagementData(overrides: Partial<UserEngagementData> = {}): UserEngagementData {
    return {
      userId: 'test-user-' + Date.now(),
      announcementId: 'test-announcement-' + Date.now(),
      action: 'view',
      timestamp: new Date(),
      timestamp: new Date(),
      metadata: {
        source: 'test',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '192.168.1.1',
        referrer: 'https://test.example.com',
        duration: 30000,
      },
      ...overrides,
    };
  }

  static createBulkAnnouncements(count: number, baseOverrides: Partial<EventAnnouncement> = {}): EventAnnouncement[] {
    return Array.from({ length: count }, (_, i) =>
      this.createMockAnnouncement({
        id: `bulk-announcement-${i}`,
        title: `Bulk Announcement ${i + 1}`,
        content: `This is bulk announcement number ${i + 1} with sufficient content for validation.`,
        slug: `bulk-announcement-${i}`,
        ...baseOverrides,
      })
    );
  }

  static createBulkTemplates(count: number, baseOverrides: Partial<AnnouncementTemplate> = {}): AnnouncementTemplate[] {
    return Array.from({ length: count }, (_, i) =>
      this.createMockTemplate({
        id: `bulk-template-${i}`,
        name: `Bulk Template ${i + 1}`,
        titleTemplate: `Template ${i + 1}: {{title}}`,
        contentTemplate: `This is template ${i + 1} content: {{content}}`,
        ...baseOverrides,
      })
    );
  }

  static createBulkEngagementData(count: number, baseOverrides: Partial<UserEngagementData> = {}): UserEngagementData[] {
    const actions = ['view', 'like', 'share', 'click', 'acknowledge'] as const;
    return Array.from({ length: count }, (_, i) =>
      this.createMockEngagementData({
        userId: `bulk-user-${i % 10}`, // 10 different users
        announcementId: `bulk-announcement-${i % 5}`, // 5 different announcements
        action: actions[i % actions.length],
        ...baseOverrides,
      })
    );
  }
}

/**
 * Mock repository factory for creating consistent mock repositories
 */
export class MockRepositoryFactory {
  static createMockAnnouncementRepository(): jest.Mocked<Repository<EventAnnouncement>> {
    return {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      softDelete: jest.fn(),
      softRemove: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      countBy: jest.fn(),
      sum: jest.fn(),
      average: jest.fn(),
      minimum: jest.fn(),
      maximum: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      insert: jest.fn(),
      upsert: jest.fn(),
      exist: jest.fn(),
      existsBy: jest.fn(),
      findAndCount: jest.fn(),
      findAndCountBy: jest.fn(),
      findBy: jest.fn(),
      findByIds: jest.fn(),
      clear: jest.fn(),
      getId: jest.fn(),
      hasId: jest.fn(),
      merge: jest.fn(),
      preload: jest.fn(),
      query: jest.fn(),
      recover: jest.fn(),
      reload: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        andHaving: jest.fn().mockReturnThis(),
        orHaving: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        loadRelationIdAndMap: jest.fn().mockReturnThis(),
        cache: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getQuery: jest.fn(),
        getQueryAndParameters: jest.fn(),
        getSql: jest.fn(),
        printSql: jest.fn(),
        execute: jest.fn(),
        stream: jest.fn(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getOne: jest.fn(),
        getOneOrFail: jest.fn(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getRawAndEntities: jest.fn(),
        clone: jest.fn(),
        disableEscaping: jest.fn().mockReturnThis(),
        getExists: jest.fn(),
        relation: jest.fn(),
        of: jest.fn(),
        set: jest.fn(),
        add: jest.fn(),
        addAndRemove: jest.fn(),
        remove: jest.fn(),
        loadMany: jest.fn(),
        loadOne: jest.fn(),
      })),
      manager: {} as any,
      metadata: {} as any,
      target: EventAnnouncement,
      queryRunner: undefined,
    return {} as jest.Mocked<Repository<EventAnnouncement>>;
  }

  static createMockTemplateRepository(): jest.Mocked<Repository<AnnouncementTemplate>> {
    return {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      softDelete: jest.fn(),
      softRemove: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      countBy: jest.fn(),
      sum: jest.fn(),
      average: jest.fn(),
      minimum: jest.fn(),
      maximum: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      insert: jest.fn(),
      upsert: jest.fn(),
      exist: jest.fn(),
      existsBy: jest.fn(),
      findAndCount: jest.fn(),
      findAndCountBy: jest.fn(),
      findBy: jest.fn(),
      findByIds: jest.fn(),
      clear: jest.fn(),
      getId: jest.fn(),
      hasId: jest.fn(),
      merge: jest.fn(),
      preload: jest.fn(),
      query: jest.fn(),
      recover: jest.fn(),
      reload: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        andHaving: jest.fn().mockReturnThis(),
        orHaving: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        loadRelationCountAndMap: jest.fn().mockReturnThis(),
        loadRelationIdAndMap: jest.fn().mockReturnThis(),
        cache: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getQuery: jest.fn(),
        getQueryAndParameters: jest.fn(),
        getSql: jest.fn(),
        printSql: jest.fn(),
        execute: jest.fn(),
        stream: jest.fn(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getOne: jest.fn(),
        getOneOrFail: jest.fn(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getRawAndEntities: jest.fn(),
        clone: jest.fn(),
        disableEscaping: jest.fn().mockReturnThis(),
        getExists: jest.fn(),
        relation: jest.fn(),
        of: jest.fn(),
        set: jest.fn(),
        add: jest.fn(),
        addAndRemove: jest.fn(),
        remove: jest.fn(),
        loadMany: jest.fn(),
        loadOne: jest.fn(),
      })),
      manager: {} as any,
      metadata: {} as any,
      target: AnnouncementTemplate,
      queryRunner: undefined,
    return {} as jest.Mocked<Repository<AnnouncementTemplate>>;
  }
}

/**
 * Test assertion helpers
 */
export class TestAssertionHelpers {
  static assertValidAnnouncement(announcement: EventAnnouncement): void {
    expect(announcement).toBeDefined();
    expect(announcement.id).toBeDefined();
    expect(announcement.title).toBeDefined();
    expect(announcement.content).toBeDefined();
    expect(announcement.type).toBeDefined();
    expect(announcement.priority).toBeDefined();
    expect(announcement.createdAt).toBeInstanceOf(Date);
    expect(announcement.updatedAt).toBeInstanceOf(Date);
  }

  static assertValidTemplate(template: AnnouncementTemplate): void {
    expect(template).toBeDefined();
    expect(template.id).toBeDefined();
    expect(template.name).toBeDefined();
    expect(template.titleTemplate).toBeDefined();
    expect(template.contentTemplate).toBeDefined();
    expect(template.category).toBeDefined();
    expect(template.type).toBeDefined();
    expect(template.priority).toBeDefined();
    expect(template.createdAt).toBeInstanceOf(Date);
    expect(template.updatedAt).toBeInstanceOf(Date);
  }

  static assertValidEngagementData(data: UserEngagementData): void {
    expect(data).toBeDefined();
    expect(data.userId).toBeDefined();
    expect(data.announcementId).toBeDefined();
    expect(data.action).toBeDefined();
    expect(['view', 'like', 'share', 'click', 'acknowledge']).toContain(data.action);
  }

  static assertPaginationResponse(response: any, expectedTotal?: number): void {
    expect(response).toBeDefined();
    expect(response.data).toBeInstanceOf(Array);
    expect(response.total).toBeDefined();
    expect(response.page).toBeDefined();
    expect(response.limit).toBeDefined();
    expect(response.totalPages).toBeDefined();
    expect(response.hasNext).toBeDefined();
    expect(response.hasPrevious).toBeDefined();

    if (expectedTotal !== undefined) {
      expect(response.total).toBe(expectedTotal);
    }

    expect(response.totalPages).toBe(Math.ceil(response.total / response.limit));
    expect(response.hasNext).toBe(response.page * response.limit < response.total);
    expect(response.hasPrevious).toBe(response.page > 1);
  }

  static assertPerformanceMetrics(duration: number, maxDuration: number, operationName: string): void {
    expect(duration).toBeLessThan(maxDuration);
    if (duration > maxDuration * 0.8) {
      console.warn(`⚠️  Performance warning: ${operationName} took ${duration}ms (close to limit of ${maxDuration}ms)`);
    } else {
      console.log(`✅ Performance check passed: ${operationName} took ${duration}ms`);
    }
  }

  static assertCacheStats(stats: any): void {
    expect(stats).toBeDefined();
    expect(stats.size).toBeDefined();
    expect(stats.hits).toBeDefined();
    expect(stats.misses).toBeDefined();
    expect(stats.hitRate).toBeDefined();
    expect(stats.size).toBeGreaterThanOrEqual(0);
    expect(stats.hits).toBeGreaterThanOrEqual(0);
    expect(stats.misses).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    expect(stats.hitRate).toBeLessThanOrEqual(1);
  }

  static assertAnalyticsMetrics(metrics: any): void {
    expect(metrics).toBeDefined();
    expect(metrics.announcementId).toBeDefined();
    expect(metrics.views).toBeGreaterThanOrEqual(0);
    expect(metrics.likes).toBeGreaterThanOrEqual(0);
    expect(metrics.shares).toBeGreaterThanOrEqual(0);
    expect(metrics.clicks).toBeGreaterThanOrEqual(0);
    expect(metrics.acknowledges).toBeGreaterThanOrEqual(0);
    expect(metrics.engagementRate).toBeGreaterThanOrEqual(0);
    expect(metrics.engagementRate).toBeLessThanOrEqual(1);
  }
}

/**
 * Test data generators for stress testing
 */
export class StressTestDataGenerator {
  static generateLargeAnnouncement(): CreateEventAnnouncementDto {
    return {
      title: 'Large Stress Test Announcement',
      content: 'A'.repeat(4000), // Large content near the limit
      summary: 'B'.repeat(400), // Large summary near the limit
      type: AnnouncementType.GENERAL,
      priority: AnnouncementPriority.NORMAL,
      targetAudience: Array.from({ length: 50 }, (_, i) => `audience-${i}`),
      tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`),
      categories: Array.from({ length: 10 }, (_, i) => `category-${i}`),
      rules: 'C'.repeat(900), // Large rules content
      prizes: 'D'.repeat(900), // Large prizes content
      requirements: 'E'.repeat(400), // Large requirements content
      createdBy: '123e4567-e89b-12d3-a456-426614174000',
    };
  }

  static generateComplexTemplate(): Partial<AnnouncementTemplate> {
    return {
      name: 'Complex Stress Test Template',
      description: 'A complex template for stress testing with many variables',
      titleTemplate: '{{prefix}} {{eventName}} - {{eventDate}} {{suffix}}',
      contentTemplate: `
        {{greeting}} {{userName}},
        
        We're excited to announce {{eventName}}!
        
        📅 Date: {{eventDate}}
        🕐 Time: {{eventTime}}
        📍 Location: {{location}}
        🎯 Category: {{category}}
        
        {{description}}
        
        {{#hasRegistration}}
        Registration Details:
        - URL: {{registrationUrl}}
        - Deadline: {{registrationDeadline}}
        - Cost: {{cost}}
        {{/hasRegistration}}
        
        {{#hasRules}}
        Rules:
        {{rules}}
        {{/hasRules}}
        
        {{#hasPrizes}}
        Prizes:
        {{prizes}}
        {{/hasPrizes}}
        
        Contact: {{contactEmail}}
        
        {{signature}}
      `,
      variables: {
        prefix: { type: 'string', required: false, defaultValue: '🎉' },
        eventName: { type: 'string', required: true },
        eventDate: { type: 'date', required: true },
        suffix: { type: 'string', required: false, defaultValue: '🎉' },
        greeting: { type: 'string', required: false, defaultValue: 'Dear' },
        userName: { type: 'string', required: true },
        eventTime: { type: 'string', required: true },
        location: { type: 'string', required: true },
        category: { type: 'string', required: true },
        description: { type: 'string', required: true },
        registrationUrl: { type: 'url', required: false },
        registrationDeadline: { type: 'date', required: false },
        cost: { type: 'string', required: false },
        rules: { type: 'string', required: false },
        prizes: { type: 'string', required: false },
        contactEmail: { type: 'email', required: true },
        signature: { type: 'string', required: false, defaultValue: 'Best regards,' },
      },
    };
  }

  static generateMassEngagementData(userCount: number, announcementCount: number, actionsPerUser: number): UserEngagementData[] {
    const actions = ['view', 'like', 'share', 'click', 'acknowledge'] as const;
    const data: UserEngagementData[] = [];

    for (let u = 0; u < userCount; u++) {
      for (let a = 0; a < announcementCount; a++) {
        for (let i = 0; i < actionsPerUser; i++) {
          data.push({
            userId: `stress-user-${u}`,
            announcementId: `stress-announcement-${a}`,
            action: actions[Math.floor(Math.random() * actions.length)],
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 30), // Random within last 30 days
            metadata: {
              source: 'stress-test',
              sessionId: `session-${u}-${Math.floor(i / 10)}`,
              device: Math.random() > 0.5 ? 'desktop' : 'mobile',
              userAgent: `StressTest-Agent-${u}`,
              ipAddress: `192.168.${Math.floor(u / 255)}.${u % 255}`,
            },
          });
        }
      }
    }

    return data;
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurement {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMeasurement(name, duration);
      return duration;
    };
  }

  static recordMeasurement(name: string, duration: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
  }

  static getStatistics(name: string): {
    count: number;
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
  } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const average = sorted.reduce((a, b) => a + b, 0) / count;
    const median = sorted[Math.floor(count / 2)];
    const p95 = sorted[Math.floor(count * 0.95)];

    return { count, min, max, average, median, p95 };
  }

  static getAllStatistics(): Record<string, ReturnType<typeof PerformanceMeasurement.getStatistics>> {
    const result: Record<string, ReturnType<typeof PerformanceMeasurement.getStatistics>> = {};
    for (const [name] of this.measurements) {
      result[name] = this.getStatistics(name);
    }
    return result;
  }

  static clearMeasurements(): void {
    this.measurements.clear();
  }

  static printReport(): void {
    console.log('\n📊 Performance Report:');
    console.log('=' .repeat(60));
    
    for (const [name, stats] of Object.entries(this.getAllStatistics())) {
      if (stats) {
        console.log(`\n${name}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Min: ${stats.min.toFixed(2)}ms`);
        console.log(`  Max: ${stats.max.toFixed(2)}ms`);
        console.log(`  Average: ${stats.average.toFixed(2)}ms`);
        console.log(`  Median: ${stats.median.toFixed(2)}ms`);
        console.log(`  95th Percentile: ${stats.p95.toFixed(2)}ms`);
      }
    }
    
    console.log('=' .repeat(60));
  }
}