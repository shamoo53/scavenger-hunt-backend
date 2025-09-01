import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventAnnouncementsModule } from './event-announcements.module';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncementsController } from './event-announcements.controller';
import { EventAnnouncement } from './entities/event-announcement.entity';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from './enums/announcement.enum';

describe('EventAnnouncements Integration', () => {
  let module: TestingModule;
  let service: EventAnnouncementsService;
  let controller: EventAnnouncementsController;
  let repository: Repository<EventAnnouncement>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [EventAnnouncement],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        ScheduleModule.forRoot(),
        EventAnnouncementsModule,
      ],
    }).compile();

    service = module.get<EventAnnouncementsService>(EventAnnouncementsService);
    controller = module.get<EventAnnouncementsController>(
      EventAnnouncementsController,
    );
    repository = module.get<Repository<EventAnnouncement>>(
      getRepositoryToken(EventAnnouncement),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('Module Integration', () => {
    it('should have all components properly injected', () => {
      expect(service).toBeDefined();
      expect(controller).toBeDefined();
      expect(repository).toBeDefined();
    });

    it('should create and retrieve announcements through the full stack', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Integration Test Gaming Tournament',
        content:
          'This is a comprehensive integration test for the gaming tournament announcement system with detailed content.',
        type: AnnouncementType.COMPETITION,
        priority: AnnouncementPriority.HIGH,
        category: 'gaming',
        tags: ['integration', 'test', 'gaming'],
        eventDate: new Date('2024-06-15T10:00:00Z'),
        location: 'Virtual Arena',
        maxParticipants: 100,
        createdBy: 'integration-test-user',
        createdByName: 'Integration Test Admin',
      };

      // Create through controller
      const created = await controller.create(createDto);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.title).toBe(createDto.title);
      expect(created.slug).toBeDefined();
      expect(created.readingTimeMinutes).toBeGreaterThan(0);

      // Retrieve through controller
      const retrieved = await controller.findOne(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe(createDto.title);
      expect(retrieved.viewCount).toBe(1); // Auto-incremented on findOne

      // Verify in database
      const dbRecord = await repository.findOne({ where: { id: created.id } });
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.title).toBe(createDto.title);
    });

    it('should handle complete announcement lifecycle', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Lifecycle Test Tournament',
        content:
          'This announcement will go through the complete lifecycle including creation, update, engagement, and deletion.',
        type: AnnouncementType.EVENT,
        priority: AnnouncementPriority.NORMAL,
        category: 'testing',
        createdBy: 'lifecycle-test-user',
      };

      // 1. Create
      const created = await service.create(createDto);
      expect(created.isPublished).toBe(true);
      expect(created.isActive).toBe(true);

      // 2. Update
      const updated = await service.update(created.id, {
        isFeatured: true,
        priority: AnnouncementPriority.HIGH,
        maxParticipants: 250,
      });
      expect(updated.isFeatured).toBe(true);
      expect(updated.priority).toBe(AnnouncementPriority.HIGH);
      expect(updated.maxParticipants).toBe(250);

      // 3. Engagement tracking
      await service.incrementViewCount(created.id);
      await service.incrementLikeCount(created.id);
      await service.incrementShareCount(created.id);

      const afterEngagement = await service.findOne(created.id);
      expect(afterEngagement.viewCount).toBe(1);
      expect(afterEngagement.likeCount).toBe(1);
      expect(afterEngagement.shareCount).toBe(1);

      // 4. Soft delete
      await service.softRemove(created.id);

      // Should not be found in normal queries
      const deleted = await repository.findOne({ where: { id: created.id } });
      expect(deleted).toBeNull();

      // 5. Restore
      const restored = await service.restore(created.id);
      expect(restored.id).toBe(created.id);
      expect(restored.deletedAt).toBeNull();

      // 6. Hard delete
      await service.remove(created.id);

      const finalCheck = await repository.findOne({
        where: { id: created.id },
        withDeleted: true,
      });
      expect(finalCheck).toBeNull();
    });
  });

  describe('Query and Filtering Integration', () => {
    beforeEach(async () => {
      // Create test data
      const testAnnouncements = [
        {
          title: 'Gaming Championship 2024',
          content:
            'The biggest gaming tournament with amazing prizes and competitive gameplay for all skill levels.',
          type: AnnouncementType.COMPETITION,
          priority: AnnouncementPriority.HIGH,
          category: 'gaming',
          tags: ['gaming', 'championship', 'competition'],
          isPublished: true,
          isFeatured: true,
          eventDate: new Date('2024-06-15T10:00:00Z'),
          createdBy: 'admin-1',
        },
        {
          title: 'System Maintenance Notice',
          content:
            'Scheduled maintenance will be performed on the platform to improve performance and security.',
          type: AnnouncementType.MAINTENANCE,
          priority: AnnouncementPriority.URGENT,
          category: 'system',
          tags: ['maintenance', 'system', 'downtime'],
          isPublished: true,
          isFeatured: false,
          eventDate: new Date('2024-05-20T02:00:00Z'),
          createdBy: 'admin-2',
        },
        {
          title: 'Community Event Announcement',
          content:
            'Join our community for a special event celebrating our platform milestones and achievements.',
          type: AnnouncementType.COMMUNITY,
          priority: AnnouncementPriority.NORMAL,
          category: 'community',
          tags: ['community', 'celebration', 'milestone'],
          isPublished: false,
          isFeatured: false,
          eventDate: new Date('2024-07-10T18:00:00Z'),
          createdBy: 'admin-3',
        },
      ];

      for (const announcementData of testAnnouncements) {
        await service.create(announcementData as CreateEventAnnouncementDto);
      }
    });

    it('should filter by type', async () => {
      const competitions = await service.findByType(
        AnnouncementType.COMPETITION,
      );
      expect(competitions).toHaveLength(1);
      expect(competitions[0].type).toBe(AnnouncementType.COMPETITION);
      expect(competitions[0].title).toContain('Gaming Championship');
    });

    it('should filter by category', async () => {
      const gamingAnnouncements = await service.findByCategory('gaming');
      expect(gamingAnnouncements).toHaveLength(1);
      expect(gamingAnnouncements[0].category).toBe('gaming');
    });

    it('should find featured announcements', async () => {
      const featured = await service.getFeaturedAnnouncements();
      expect(featured).toHaveLength(1);
      expect(featured[0].isFeatured).toBe(true);
      expect(featured[0].title).toContain('Gaming Championship');
    });

    it('should find published announcements only', async () => {
      const published = await service.findPublished();
      expect(published).toHaveLength(2); // Gaming and Maintenance
      expect(published.every((a) => a.isPublished)).toBe(true);
    });

    it('should search with complex queries', async () => {
      const searchResult = await service.findAll({
        search: 'gaming',
        type: AnnouncementType.COMPETITION,
        isPublished: true,
        sortBy: 'priority',
        sortOrder: 'DESC',
      });

      expect(searchResult.data).toHaveLength(1);
      expect(searchResult.data[0].title).toContain('Gaming Championship');
      expect(searchResult.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await service.findAll({
        page: 1,
        limit: 1,
        isPublished: true,
      });

      expect(page1.data).toHaveLength(1);
      expect(page1.totalPages).toBe(2);
      expect(page1.hasNext).toBe(true);
      expect(page1.hasPrevious).toBe(false);

      const page2 = await service.findAll({
        page: 2,
        limit: 1,
        isPublished: true,
      });

      expect(page2.data).toHaveLength(1);
      expect(page2.hasNext).toBe(false);
      expect(page2.hasPrevious).toBe(true);
    });

    it('should find announcements by tags', async () => {
      const gamingTags = await service.getAnnouncementsByTags([
        'gaming',
        'championship',
      ]);
      expect(gamingTags).toHaveLength(1);
      expect(gamingTags[0].tags).toContain('gaming');
      expect(gamingTags[0].tags).toContain('championship');
    });
  });

  describe('Bulk Operations Integration', () => {
    let testIds: string[];

    beforeEach(async () => {
      testIds = [];

      for (let i = 0; i < 5; i++) {
        const announcement = await service.create({
          title: `Bulk Test Announcement ${i + 1}`,
          content: `This is test announcement number ${i + 1} for bulk operations testing with comprehensive content.`,
          type: AnnouncementType.GENERAL,
          priority: AnnouncementPriority.NORMAL,
          category: 'testing',
          isPublished: i % 2 === 0,
          createdBy: 'bulk-test-admin',
        });
        testIds.push(announcement.id);
      }
    });

    it('should perform bulk publish operation', async () => {
      const unpublishedIds = testIds.filter((_, index) => index % 2 === 1);

      await service.bulkUpdate(unpublishedIds, {
        isPublished: true,
        publishedAt: new Date(),
      });

      const allAnnouncements = await service.findAll({ includeDeleted: true });
      const publishedCount = allAnnouncements.data.filter(
        (a) => a.isPublished,
      ).length;

      expect(publishedCount).toBe(5); // All should now be published
    });

    it('should perform bulk feature operation', async () => {
      await service.bulkUpdate(testIds.slice(0, 3), {
        isFeatured: true,
      });

      const featured = await service.getFeaturedAnnouncements();
      expect(featured.length).toBeGreaterThanOrEqual(3);
    });

    it('should perform bulk delete operation', async () => {
      await service.bulkDelete(testIds.slice(0, 2));

      const remaining = await service.findAll({});
      expect(remaining.data).toHaveLength(3);
    });
  });

  describe('Statistics Integration', () => {
    beforeEach(async () => {
      // Create diverse test data for statistics
      const announcements = [
        {
          title: 'High Priority Competition',
          content:
            'A high priority competition announcement with comprehensive details and engaging content.',
          type: AnnouncementType.COMPETITION,
          priority: AnnouncementPriority.HIGH,
          category: 'gaming',
          isPublished: true,
          isFeatured: true,
          isPinned: true,
          createdBy: 'stats-admin',
        },
        {
          title: 'Normal Event Announcement',
          content:
            'A normal priority event announcement with standard content and regular importance level.',
          type: AnnouncementType.EVENT,
          priority: AnnouncementPriority.NORMAL,
          category: 'events',
          isPublished: true,
          isFeatured: false,
          createdBy: 'stats-admin',
        },
        {
          title: 'Draft Maintenance Notice',
          content:
            'A draft maintenance notice that has not been published yet but contains important information.',
          type: AnnouncementType.MAINTENANCE,
          priority: AnnouncementPriority.URGENT,
          category: 'system',
          isPublished: false,
          createdBy: 'stats-admin',
        },
      ];

      for (const announcement of announcements) {
        const created = await service.create(
          announcement as CreateEventAnnouncementDto,
        );

        // Add some engagement data
        await service.incrementViewCount(created.id);
        await service.incrementLikeCount(created.id);
        if (announcement.isPublished) {
          await service.incrementShareCount(created.id);
        }
      }
    });

    it('should generate accurate statistics', async () => {
      const stats = await service.getAnnouncementStatistics();

      expect(stats.totalAnnouncements).toBe(3);
      expect(stats.publishedAnnouncements).toBe(2);
      expect(stats.draftAnnouncements).toBe(1);
      expect(stats.featuredAnnouncements).toBe(1);
      expect(stats.pinnedAnnouncements).toBe(1);
      expect(stats.totalViews).toBe(3);
      expect(stats.totalLikes).toBe(3);
      expect(stats.totalShares).toBe(2);
      expect(stats.typesCount).toBeGreaterThan(0);
    });

    it('should get metadata correctly', async () => {
      const types = await service.getTypes();
      const categories = await service.getCategories();
      const tags = await service.getAllTags();

      expect(types).toContain('competition');
      expect(types).toContain('event');
      expect(types).toContain('maintenance');

      expect(categories).toContain('gaming');
      expect(categories).toContain('events');
      expect(categories).toContain('system');

      expect(tags).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidDto = {
        title: 'Short', // Too short
        content: 'Also short', // Too short
        createdBy: 'test-user',
      } as CreateEventAnnouncementDto;

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should handle non-existent resource access', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.findOne(nonExistentId)).rejects.toThrow();
      await expect(
        service.update(nonExistentId, { title: 'Updated' }),
      ).rejects.toThrow();
      await expect(service.remove(nonExistentId)).rejects.toThrow();
    });

    it('should handle slug conflicts gracefully', async () => {
      const baseDto: CreateEventAnnouncementDto = {
        title: 'Duplicate Slug Test Tournament',
        content:
          'This announcement tests how the system handles duplicate slug generation scenarios.',
        createdBy: 'slug-test-admin',
      };

      // Create first announcement
      const first = await service.create(baseDto);
      expect(first.slug).toBe('duplicate-slug-test-tournament');

      // Create second with same title
      const second = await service.create(baseDto);
      expect(second.slug).toBe('duplicate-slug-test-tournament-1');

      // Create third with same title
      const third = await service.create(baseDto);
      expect(third.slug).toBe('duplicate-slug-test-tournament-2');

      // All slugs should be unique
      const slugs = [first.slug, second.slug, third.slug];
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(3);
    });
  });
});
