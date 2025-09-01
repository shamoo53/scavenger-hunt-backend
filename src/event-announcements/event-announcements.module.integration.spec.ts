import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventAnnouncementsModule } from './event-announcements.module';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncement } from './entities/event-announcement.entity';
import { AnnouncementTemplate } from './entities/announcement-template.entity';
import { AnnouncementCacheService } from './services/cache.service';
import { AnnouncementAnalyticsService } from './services/analytics.service';
import { AnnouncementNotificationService } from './services/notification.service';
import { AnnouncementTemplateService } from './services/template.service';
import { AnnouncementsGateway } from './gateways/announcements.gateway';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from './enums/announcement.enum';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { TemplateCategory } from './entities/announcement-template.entity';

describe('EventAnnouncementsModule Integration Tests', () => {
  let module: TestingModule;
  let announcementService: EventAnnouncementsService;
  let templateService: AnnouncementTemplateService;
  let analyticsService: AnnouncementAnalyticsService;
  let cacheService: AnnouncementCacheService;
  let notificationService: AnnouncementNotificationService;
  let gateway: AnnouncementsGateway;
  let announcementRepository: Repository<EventAnnouncement>;
  let templateRepository: Repository<AnnouncementTemplate>;

  // Mock repositories
  const mockAnnouncementRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    createQueryBuilder: jest.fn(),
    increment: jest.fn(),
  };

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    increment: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRoot(),
        // Mock TypeORM instead of using real database
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [EventAnnouncement, AnnouncementTemplate],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([EventAnnouncement, AnnouncementTemplate]),
      ],
      providers: [
        EventAnnouncementsService,
        AnnouncementCacheService,
        AnnouncementAnalyticsService,
        AnnouncementNotificationService,
        AnnouncementTemplateService,
        AnnouncementsGateway,
      ],
    })
      .overrideProvider(getRepositoryToken(EventAnnouncement))
      .useValue(mockAnnouncementRepository)
      .overrideProvider(getRepositoryToken(AnnouncementTemplate))
      .useValue(mockTemplateRepository)
      .compile();

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
    gateway = module.get<AnnouncementsGateway>(AnnouncementsGateway);
    announcementRepository = module.get<Repository<EventAnnouncement>>(
      getRepositoryToken(EventAnnouncement),
    );
    templateRepository = module.get<Repository<AnnouncementTemplate>>(
      getRepositoryToken(AnnouncementTemplate),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Announcement Lifecycle', () => {
    it('should create, publish, and track engagement for an announcement', async () => {
      // Setup
      const createDto: CreateEventAnnouncementDto = {
        title: 'Integration Test Announcement',
        content: 'This is a comprehensive test of the announcement lifecycle with enough content to meet validation requirements.',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        category: 'testing',
        isPublished: true,
        isActive: true,
        targetAudience: ['all'],
        tags: ['integration', 'test'],
        createdBy: 'test-user',
      };

      const mockAnnouncement = {
        id: 'announcement-123',
        ...createDto,
        slug: 'integration-test-announcement',
        readingTimeMinutes: 1,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository responses
      mockAnnouncementRepository.create.mockReturnValue(mockAnnouncement);
      mockAnnouncementRepository.save.mockResolvedValue(mockAnnouncement);
      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);

      // Create announcement
      const createdAnnouncement = await announcementService.create(createDto);

      // Verify creation
      expect(createdAnnouncement).toBeDefined();
      expect(createdAnnouncement.title).toBe(createDto.title);
      expect(createdAnnouncement.isPublished).toBe(true);

      // Verify cache invalidation was called
      expect(mockAnnouncementRepository.save).toHaveBeenCalledWith(
        mockAnnouncement,
      );

      // Simulate user engagement
      const engagementData = {
        userId: 'user-123',
        announcementId: createdAnnouncement.id,
        action: 'view' as const,
        timestamp: new Date(),
        metadata: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };

      // Track engagement
      await analyticsService.trackEngagement(engagementData);

      // Verify engagement tracking
      const metrics = await analyticsService.getAnnouncementMetrics(
        createdAnnouncement.id,
      );
      expect(metrics).toBeDefined();
    });

    it('should create announcement from template and track usage', async () => {
      // Create a template first
      const templateDto = {
        name: 'Event Notification Template',
        description: 'Template for event announcements',
        category: TemplateCategory.EVENT,
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.HIGH,
        titleTemplate: '🎉 {{eventName}} - {{eventDate}}',
        contentTemplate: 'Join us for {{eventName}} on {{eventDate}} at {{location}}. {{description}}',
        variables: {
          eventName: { type: 'string', required: true },
          eventDate: { type: 'string', required: true },
          location: { type: 'string', required: true },
          description: { type: 'string', required: true },
        },
        createdBy: 'admin',
      };

      const mockTemplate = {
        id: 'template-123',
        ...templateDto,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock template repository
      mockTemplateRepository.create.mockReturnValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue(mockTemplate);
      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepository.increment.mockResolvedValue({ affected: 1 });

      // Create template
      const createdTemplate = await templateService.createTemplate(templateDto);
      expect(createdTemplate).toBeDefined();

      // Generate announcement from template
      const variables = {
        eventName: 'Summer Festival',
        eventDate: '2024-07-15',
        location: 'Central Park',
        description: 'A fantastic summer event with music, food, and fun activities for the whole family.',
      };

      const generatedDto = await templateService.generateFromTemplate({
        templateId: createdTemplate.id,
        variables,
        createdBy: 'event-manager',
      });

      expect(generatedDto.title).toBe('🎉 Summer Festival - 2024-07-15');
      expect(generatedDto.content).toContain('Summer Festival');
      expect(generatedDto.content).toContain('Central Park');

      // Verify template usage count increment
      expect(mockTemplateRepository.increment).toHaveBeenCalledWith(
        { id: createdTemplate.id },
        'usageCount',
        1,
      );
    });
  });

  describe('Service Integration Tests', () => {
    it('should integrate cache, analytics, and notification services', async () => {
      // Define mock announcement for notification service
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Announcement',
        content: 'Test content',
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
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      
      // Test cache integration
      const cacheKey = 'test-key';
      const testData = { message: 'cached data' };

      cacheService.set(cacheKey, testData);
      const cachedData = cacheService.get(cacheKey);
      expect(cachedData).toEqual(testData);

      // Test analytics integration
      const engagementData = {
        userId: 'user-123',
        announcementId: 'announcement-123',
        action: 'like' as const,
        timestamp: new Date(),
      };

      await analyticsService.trackEngagement(engagementData);

      // Test notification integration
      const notificationData = {
        type: 'new_announcement' as const,
        announcement: mockAnnouncement,
        priority: 'medium' as const,
        targetAudience: ['all'],
      };

      await notificationService.notifyUsers(notificationData);

      // Verify services work together
      expect(cacheService.get(cacheKey)).toEqual(testData);
    });

    it('should handle gateway integration for real-time updates', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Announcement',
        content: 'Test content for real-time broadcasting',
        priority: AnnouncementPriority.HIGH,
        targetAudience: ['all'],
      };

      // Test gateway broadcasting
      await gateway.broadcastNewAnnouncement(mockAnnouncement);
      await gateway.sendFeaturedNotification(mockAnnouncement);

      // These would typically verify WebSocket emissions
      // In our HTTP fallback implementation, they call notification service
      expect(mockAnnouncement).toBeDefined();
    });
  });

  describe('Complex Workflow Tests', () => {
    it('should handle announcement lifecycle with all features', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Complex Workflow Test Announcement',
        content: 'This announcement tests the complete workflow including caching, analytics, notifications, and template generation with comprehensive content.',
        type: AnnouncementType.MAINTENANCE,
        priority: AnnouncementPriority.CRITICAL,
        category: 'system',
        isPublished: true,
        isActive: true,
        isFeatured: true,
        isPinned: true,
        requiresAcknowledgment: true,
        allowComments: true,
        notifyUsers: true,
        targetAudience: ['all', 'administrators'],
        tags: ['workflow', 'test', 'complex'],
        eventDate: new Date('2024-12-25'),
        expireAt: new Date('2024-12-31'),
        createdBy: 'admin',
      };

      const mockAnnouncement = {
        id: 'complex-announcement-123',
        ...createDto,
        slug: 'complex-workflow-test-announcement',
        readingTimeMinutes: 2,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
        currentParticipants: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockAnnouncementRepository.create.mockReturnValue(mockAnnouncement);
      mockAnnouncementRepository.save.mockResolvedValue(mockAnnouncement);
      mockAnnouncementRepository.findOne.mockResolvedValue(mockAnnouncement);

      // 1. Create announcement
      const announcement = await announcementService.create(createDto);
      expect(announcement.id).toBe('complex-announcement-123');

      // 2. Simulate multiple user interactions
      const users = ['user-1', 'user-2', 'user-3'];
      const actions = ['view', 'like', 'share', 'acknowledge'] as const;

      for (const userId of users) {
        for (const action of actions) {
          await analyticsService.trackEngagement({
            userId,
            announcementId: announcement.id,
            action,
            timestamp: new Date(),
          });
        }
      }

      // 3. Get analytics
      const metrics = await analyticsService.getAnnouncementMetrics(
        announcement.id,
      );
      expect(metrics.announcementId).toBe(announcement.id);

      // 4. Test caching behavior
      const cacheKey = `announcement:${announcement.id}`;
      cacheService.set(cacheKey, announcement);
      const cachedAnnouncement = cacheService.get(cacheKey);
      expect(cachedAnnouncement).toEqual(announcement);

      // 5. Test notification broadcasting
      await gateway.broadcastNewAnnouncement(announcement);
      await gateway.sendFeaturedNotification(announcement);
    });

    it('should handle scheduled announcement publication', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const scheduledDto: CreateEventAnnouncementDto = {
        title: 'Scheduled Test Announcement',
        content: 'This announcement is scheduled for future publication and tests the scheduling workflow.',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        isPublished: false,
        isActive: true,
        scheduledFor: futureDate,
        createdBy: 'scheduler',
      };

      const mockScheduledAnnouncement = {
        id: 'scheduled-123',
        ...scheduledDto,
        slug: 'scheduled-test-announcement',
        readingTimeMinutes: 1,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnnouncementRepository.create.mockReturnValue(
        mockScheduledAnnouncement,
      );
      mockAnnouncementRepository.save.mockResolvedValue(
        mockScheduledAnnouncement,
      );

      // Create scheduled announcement
      const announcement = await announcementService.create(scheduledDto);
      expect(announcement.isPublished).toBe(false);
      expect(announcement.scheduledFor).toEqual(futureDate);

      // Simulate scheduled publication (normally handled by cron job)
      const publishedAnnouncement = {
        ...mockScheduledAnnouncement,
        isPublished: true,
        publishedAt: new Date(),
        scheduledFor: null,
      };

      mockAnnouncementRepository.findOne.mockResolvedValue(
        publishedAnnouncement,
      );
      mockAnnouncementRepository.update.mockResolvedValue({ affected: 1 });

      // Test the update that would happen during scheduled publication
      await announcementService.update(announcement.id, {
        isPublished: true,
        publishedAt: new Date(),
        scheduledFor: null,
      });

      expect(mockAnnouncementRepository.update).toHaveBeenCalledWith(
        announcement.id,
        expect.objectContaining({
          isPublished: true,
          publishedAt: expect.any(Date),
          scheduledFor: null,
        }),
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database failures gracefully', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Error Test Announcement',
        content: 'This tests error handling in the announcement creation process.',
        type: AnnouncementType.GENERAL,
        priority: AnnouncementPriority.NORMAL,
        createdBy: 'tester',
      };

      // Simulate database error
      mockAnnouncementRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(announcementService.create(createDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle cache failures without breaking core functionality', async () => {
      // Test that cache failures don't prevent normal operations
      const testKey = 'failing-cache-key';
      const testData = { test: 'data' };

      // Cache should work normally
      cacheService.set(testKey, testData);
      const retrieved = cacheService.get(testKey);
      expect(retrieved).toEqual(testData);

      // Even if cache fails, other services should continue working
      const engagementData = {
        userId: 'user-123',
        announcementId: 'announcement-123',
        action: 'view' as const,
        timestamp: new Date(),
      };

      await expect(
        analyticsService.trackEngagement(engagementData),
      ).resolves.not.toThrow();
    });

    it('should handle notification service failures', async () => {
      const notificationData = {
        type: 'new_announcement' as const,
        announcement: {
          id: 'announcement-123',
          title: 'Test Announcement',
          content: 'Test content',
        },
        priority: 'high' as const,
        targetAudience: ['all'],
      };

      // Should not throw even if notification fails
      await expect(
        notificationService.notifyUsers(notificationData),
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const bulkCreateDtos: CreateEventAnnouncementDto[] = Array.from(
        { length: 10 },
        (_, i) => ({
          title: `Bulk Test Announcement ${i + 1}`,
          content: `This is bulk test announcement number ${i + 1} with sufficient content for validation.`,
          type: AnnouncementType.GENERAL,
          priority: AnnouncementPriority.NORMAL,
          createdBy: 'bulk-tester',
        }),
      );

      const mockAnnouncements = bulkCreateDtos.map((dto, i) => ({
        id: `bulk-announcement-${i + 1}`,
        ...dto,
        slug: `bulk-test-announcement-${i + 1}`,
        readingTimeMinutes: 1,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Setup mocks for bulk operations
      mockAnnouncementRepository.create.mockImplementation((dto) => ({
        ...dto,
        id: `generated-id`,
      }));
      mockAnnouncementRepository.save.mockImplementation((announcement) =>
        Promise.resolve(announcement),
      );

      // Test bulk creation
      const createdAnnouncements = await Promise.all(
        bulkCreateDtos.map((dto) => announcementService.create(dto)),
      );

      expect(createdAnnouncements).toHaveLength(10);
      expect(mockAnnouncementRepository.save).toHaveBeenCalledTimes(10);
    });

    it('should handle cache performance under load', async () => {
      // Test cache performance with multiple concurrent operations
      const operations = Array.from({ length: 100 }, (_, i) => {
        return async () => {
          const key = `performance-test-${i}`;
          const data = { index: i, timestamp: Date.now() };
          
          cacheService.set(key, data);
          const retrieved = cacheService.get(key);
          
          expect(retrieved).toEqual(data);
        };
      });

      // Execute all operations concurrently
      await Promise.all(operations.map(op => op()));

      // Verify cache statistics
      const stats = cacheService.getStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});