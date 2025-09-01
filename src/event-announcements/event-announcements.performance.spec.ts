import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventAnnouncementsService } from './event-announcements.service';
import { AnnouncementCacheService } from './services/cache.service';
import { AnnouncementAnalyticsService } from './services/analytics.service';
import { AnnouncementNotificationService } from './services/notification.service';
import { AnnouncementTemplateService } from './services/template.service';
import { AnnouncementsGateway } from './gateways/announcements.gateway';
import { EventAnnouncement } from './entities/event-announcement.entity';
import { AnnouncementTemplate } from './entities/announcement-template.entity';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from './enums/announcement.enum';

describe('Event Announcements Performance Tests', () => {
  let module: TestingModule;
  let announcementService: EventAnnouncementsService;
  let templateService: AnnouncementTemplateService;
  let analyticsService: AnnouncementAnalyticsService;
  let cacheService: AnnouncementCacheService;
  let notificationService: AnnouncementNotificationService;

  // Mock repositories
  const mockAnnouncementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    increment: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        EventAnnouncementsService,
        AnnouncementCacheService,
        AnnouncementAnalyticsService,
        AnnouncementNotificationService,
        AnnouncementTemplateService,
        AnnouncementsGateway,
        {
          provide: getRepositoryToken(EventAnnouncement),
          useValue: mockAnnouncementRepository,
        },
        {
          provide: getRepositoryToken(AnnouncementTemplate),
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    announcementService = module.get<EventAnnouncementsService>(
      EventAnnouncementsService,
    );
    templateService = module.get<AnnouncementTemplateService>(
      AnnouncementTemplateService,
    );
    analyticsService = module.get<AnnouncementAnalyticsService>(
      AnnouncementAnalyticsService,
    );
    cacheService = module.get<AnnouncementCacheService>(
      AnnouncementCacheService,
    );
    notificationService = module.get<AnnouncementNotificationService>(
      AnnouncementNotificationService,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('High-Volume Operations', () => {
    it('should handle bulk announcement creation efficiently', async () => {
      const batchSize = 100;
      const announcements = Array.from({ length: batchSize }, (_, i) => ({
        id: `announcement-${i}`,
        title: `Performance Test Announcement ${i}`,
        content: `This is performance test announcement number ${i} with sufficient content for validation testing.`,
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        slug: `performance-test-announcement-${i}`,
        readingTimeMinutes: 1,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Setup mocks
      mockAnnouncementRepository.create.mockImplementation((dto) => ({
        ...dto,
        id: `generated-${Date.now()}`,
      }));
      mockAnnouncementRepository.save.mockImplementation((announcement) =>
        Promise.resolve(announcement),
      );

      const startTime = Date.now();

      // Create announcements in batches
      const batchPromises = [];
      for (let i = 0; i < batchSize; i += 10) {
        const batch = announcements.slice(i, i + 10).map((data) =>
          announcementService.create({
            title: data.title,
            content: data.content,
            type: data.type,
            priority: data.priority,
            createdBy: data.createdBy,
          }),
        );
        batchPromises.push(Promise.all(batch));
      }

      await Promise.all(batchPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockAnnouncementRepository.save).toHaveBeenCalledTimes(batchSize);

      console.log(
        `Bulk creation of ${batchSize} announcements took ${duration}ms`,
      );
    });

    it('should handle high-frequency analytics tracking', async () => {
      const eventCount = 1000;
      const users = Array.from({ length: 50 }, (_, i) => `user-${i}`);
      const announcements = Array.from(
        { length: 20 },
        (_, i) => `announcement-${i}`,
      );
      const actions = ['view', 'like', 'share', 'click', 'acknowledge'] as const;

      const startTime = Date.now();

      // Generate random engagement events
      const trackingPromises = Array.from({ length: eventCount }, () => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomAnnouncement =
          announcements[Math.floor(Math.random() * announcements.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        return analyticsService.trackEngagement({
          userId: randomUser,
          announcementId: randomAnnouncement,
          action: randomAction,
          timestamp: new Date(),
        });
      });

      await Promise.all(trackingPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      console.log(
        `Tracking ${eventCount} engagement events took ${duration}ms`,
      );
    });

    it('should handle concurrent cache operations efficiently', async () => {
      const operationCount = 500;
      const cacheOperations = [];

      const startTime = Date.now();

      // Mix of get/set operations
      for (let i = 0; i < operationCount; i++) {
        const key = `test-key-${i}`;
        const data = { id: i, timestamp: Date.now(), data: `test-data-${i}` };

        // Set operation
        cacheOperations.push(
          Promise.resolve().then(() => {
            cacheService.set(key, data);
            return data;
          }),
        );

        // Get operation (after set)
        cacheOperations.push(
          Promise.resolve().then(() => {
            return cacheService.get(key);
          }),
        );
      }

      const results = await Promise.all(cacheOperations);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results).toHaveLength(operationCount * 2);

      console.log(
        `${operationCount * 2} cache operations took ${duration}ms`,
      );
    });

    it('should handle large-scale template generation', async () => {
      const templateCount = 50;
      const generationsPerTemplate = 20;

      // Setup template mock
      const mockTemplate = {
        id: 'template-123',
        name: 'Performance Test Template',
        titleTemplate: 'Event: {{eventName}} - {{eventDate}}',
        contentTemplate: 'Join us for {{eventName}} on {{eventDate}} at {{location}}. {{description}}',
        variables: {
          eventName: { type: 'string', required: true },
          eventDate: { type: 'string', required: true },
          location: { type: 'string', required: true },
          description: { type: 'string', required: true },
        },
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.NORMAL,
        isActive: true,
        usageCount: 0,
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.increment.mockResolvedValue({ affected: 1 });

      const startTime = Date.now();

      const generationPromises = [];
      for (let t = 0; t < templateCount; t++) {
        for (let g = 0; g < generationsPerTemplate; g++) {
          const variables = {
            eventName: `Event ${t}-${g}`,
            eventDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            location: `Location ${t}-${g}`,
            description: `Description for event ${t}-${g} with sufficient content.`,
          };

          generationPromises.push(
            templateService.generateFromTemplate({
              templateId: mockTemplate.id,
              variables,
              createdBy: 'performance-test',
            }),
          );
        }
      }

      const results = await Promise.all(generationPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalGenerations = templateCount * generationsPerTemplate;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(results).toHaveLength(totalGenerations);
      expect(mockTemplateRepository.increment).toHaveBeenCalledTimes(
        totalGenerations,
      );

      console.log(
        `Generated ${totalGenerations} announcements from templates in ${duration}ms`,
      );
    });
  });

  describe('Query Performance Tests', () => {
    it('should handle complex search queries efficiently', async () => {
      const queryCount = 100;
      const mockResults = {
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `announcement-${i}`,
          title: `Test Announcement ${i}`,
          content: `Content ${i}`,
          type: AnnouncementType.GENERAL,
          priority: AnnouncementPriority.NORMAL,
        })),
        total: 500,
        page: 1,
        limit: 20,
        totalPages: 25,
        hasNext: true,
        hasPrevious: false,
      };

      // Setup query builder mock
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockResults.data, mockResults.total]),
      };

      mockAnnouncementRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const startTime = Date.now();

      // Execute multiple complex queries concurrently
      const queryPromises = Array.from({ length: queryCount }, (_, i) => {
        return announcementService.findAll({
          page: Math.floor(i / 20) + 1,
          limit: 20,
          search: `search term ${i}`,
          type: i % 2 === 0 ? AnnouncementType.EVENT : AnnouncementType.GENERAL,
          priority: i % 3 === 0 ? AnnouncementPriority.HIGH : AnnouncementPriority.NORMAL,
          isPublished: true,
          tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`],
          publishedAfter: new Date('2024-01-01'),
          publishedBefore: new Date('2024-12-31'),
          sortBy: 'publishedAt',
          sortOrder: 'DESC',
        });
      });

      await Promise.all(queryPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(queryBuilder.getManyAndCount).toHaveBeenCalledTimes(queryCount);

      console.log(`${queryCount} complex queries took ${duration}ms`);
    });

    it('should handle analytics aggregation efficiently', async () => {
      const aggregationCount = 20;

      const startTime = Date.now();

      // Run multiple analytics operations concurrently
      const analyticsPromises = [
        // Dashboard data requests
        ...Array.from({ length: aggregationCount }, () =>
          analyticsService.getDashboardData(),
        ),
        // Performance reports
        ...Array.from({ length: aggregationCount }, (_, i) => {
          const startDate = new Date('2024-01-01');
          const endDate = new Date('2024-12-31');
          return analyticsService.getAnnouncementPerformanceReport(
            startDate,
            endDate,
            50 + i,
          );
        }),
        // Trend analysis
        ...Array.from({ length: aggregationCount }, (_, i) =>
          analyticsService.getEngagementTrends('day', 30 + i),
        ),
      ];

      await Promise.all(analyticsPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      console.log(
        `${aggregationCount * 3} analytics operations took ${duration}ms`,
      );
    });
  });

  describe('Memory and Resource Usage Tests', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      const operationCycles = 10;
      const operationsPerCycle = 50;

      for (let cycle = 0; cycle < operationCycles; cycle++) {
        // Create temporary data
        const tempData = Array.from({ length: operationsPerCycle }, (_, i) => ({
          key: `temp-${cycle}-${i}`,
          data: { id: i, content: 'x'.repeat(1000) }, // 1KB of data
        }));

        // Cache operations
        tempData.forEach(({ key, data }) => {
          cacheService.set(key, data);
        });

        // Retrieve operations
        tempData.forEach(({ key }) => {
          cacheService.get(key);
        });

        // Analytics operations
        await Promise.all(
          tempData.map((_, i) =>
            analyticsService.trackEngagement({
              userId: `user-${cycle}-${i}`,
              announcementId: `announcement-${cycle}-${i}`,
              action: 'view',
            }),
          ),
        );

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(
        `Memory increase after ${operationCycles * operationsPerCycle} operations: ${Math.round(memoryIncrease / 1024 / 1024)}MB`,
      );
    });

    it('should handle cache size limits gracefully', async () => {
      const maxCacheItems = 1000;
      const itemsToCreate = maxCacheItems * 2; // Exceed cache limit

      const startTime = Date.now();

      // Fill cache beyond its limit
      for (let i = 0; i < itemsToCreate; i++) {
        cacheService.set(`cache-item-${i}`, {
          id: i,
          data: `data-${i}`,
          timestamp: Date.now(),
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete without errors
      expect(duration).toBeLessThan(2000);

      // Verify cache statistics
      const stats = cacheService.getStats();
      expect(stats.size).toBeLessThanOrEqual(maxCacheItems);

      console.log(
        `Cache handling for ${itemsToCreate} items took ${duration}ms, final cache size: ${stats.size}`,
      );
    });
  });

  describe('Concurrent Access Tests', () => {
    it('should handle concurrent announcement updates safely', async () => {
      const announcementId = 'concurrent-test-announcement';
      const concurrentUpdates = 20;

      const mockAnnouncement = {
        id: announcementId,
        title: 'Original Title',
        content: 'Original content with sufficient length for validation.',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);
      mockAnnouncementRepository.update.mockResolvedValue({ affected: 1 });

      const startTime = Date.now();

      // Simulate concurrent updates
      const updatePromises = Array.from({ length: concurrentUpdates }, (_, i) =>
        announcementService.update(announcementId, {
          title: `Updated Title ${i}`,
          content: `Updated content ${i} with sufficient length for validation testing.`,
        }),
      );

      await Promise.all(updatePromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(mockAnnouncementRepository.update).toHaveBeenCalledTimes(
        concurrentUpdates,
      );

      console.log(
        `${concurrentUpdates} concurrent updates took ${duration}ms`,
      );
    });

    it('should handle concurrent notification broadcasting', async () => {
      const notificationCount = 100;
      const targetAudiences = [['all'], ['students'], ['faculty'], ['staff']];

      const startTime = Date.now();

      // Simulate concurrent notifications
      const notificationPromises = Array.from(
        { length: notificationCount },
        (_, i) => {
          const targetAudience =
            targetAudiences[i % targetAudiences.length];
          return notificationService.notifyUsers({
            type: 'new_announcement',
            announcement: {
              id: `announcement-${i}`,
              title: `Concurrent Test ${i}`,
              content: `Content ${i}`,
            },
            priority: 'normal',
            targetAudience,
          });
        },
      );

      await Promise.all(notificationPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(
        `${notificationCount} concurrent notifications took ${duration}ms`,
      );
    });
  });

  describe('Stress Tests', () => {
    it('should maintain performance under sustained load', async () => {
      const testDuration = 5000; // 5 seconds
      const operationInterval = 10; // Every 10ms
      let operationCount = 0;

      const startTime = Date.now();

      // Run sustained load test
      const loadTest = new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          // Mix of operations
          const operations = [
            () => cacheService.set(`load-test-${operationCount}`, { data: operationCount }),
            () => cacheService.get(`load-test-${Math.floor(operationCount / 2)}`),
            () => analyticsService.trackEngagement({
              userId: `user-${operationCount % 10}`,
              announcementId: `announcement-${operationCount % 5}`,
              action: 'view',
            }),
          ];

          const randomOperation = operations[operationCount % operations.length];
          await randomOperation();
          operationCount++;

          if (Date.now() - startTime >= testDuration) {
            clearInterval(interval);
            resolve();
          }
        }, operationInterval);
      });

      await loadTest;

      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const operationsPerSecond = operationCount / (actualDuration / 1000);

      // Performance assertions
      expect(operationsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec
      expect(actualDuration).toBeGreaterThanOrEqual(testDuration - 100); // Allow small timing variance

      console.log(
        `Sustained load test: ${operationCount} operations in ${actualDuration}ms (${operationsPerSecond.toFixed(2)} ops/sec)`,
      );
    });
  });
});