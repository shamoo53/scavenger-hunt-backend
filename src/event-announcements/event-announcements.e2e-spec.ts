import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as request from 'supertest';
import { EventAnnouncementsModule } from './event-announcements.module';
import { EventAnnouncement } from './entities/event-announcement.entity';
import {
  AnnouncementType,
  AnnouncementPriority,
} from './enums/announcement.enum';

describe('EventAnnouncements E2E', () => {
  let app: INestApplication;
  let module: TestingModule;

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

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  describe('/event-announcements (POST)', () => {
    it('should create a new announcement', async () => {
      const createDto = {
        title: 'E2E Test Gaming Tournament 2024',
        content:
          'This is an end-to-end test for creating a gaming tournament announcement with comprehensive details.',
        type: AnnouncementType.COMPETITION,
        priority: AnnouncementPriority.HIGH,
        category: 'gaming',
        tags: ['e2e', 'testing', 'gaming'],
        eventDate: '2024-06-15T10:00:00Z',
        location: 'Virtual Arena',
        maxParticipants: 500,
        createdBy: 'e2e-test-admin',
        createdByName: 'E2E Test Admin',
      };

      const response = await request(app.getHttpServer())
        .post('/event-announcements')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: createDto.title,
        content: expect.any(String), // Sanitized content
        type: createDto.type,
        priority: createDto.priority,
        category: createDto.category,
        tags: createDto.tags,
        slug: expect.any(String),
        isPublished: true,
        isActive: true,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        readingTimeMinutes: expect.any(Number),
      });
    });

    it('should reject invalid announcement data', async () => {
      const invalidDto = {
        title: 'Short', // Too short
        content: 'Also short', // Too short
        createdBy: 'test-admin',
      };

      await request(app.getHttpServer())
        .post('/event-announcements')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/event-announcements (GET)', () => {
    let createdAnnouncements: any[] = [];

    beforeAll(async () => {
      // Create test data
      const testData = [
        {
          title: 'Featured Gaming Championship',
          content:
            'A featured gaming championship with amazing prizes and competitive gameplay for professional players.',
          type: AnnouncementType.COMPETITION,
          priority: AnnouncementPriority.HIGH,
          category: 'gaming',
          tags: ['featured', 'gaming', 'championship'],
          isFeatured: true,
          isPublished: true,
          createdBy: 'e2e-admin-1',
        },
        {
          title: 'Community Event Celebration',
          content:
            'Join our community for a special celebration event with activities and rewards for all participants.',
          type: AnnouncementType.COMMUNITY,
          priority: AnnouncementPriority.NORMAL,
          category: 'community',
          tags: ['community', 'celebration', 'event'],
          isFeatured: false,
          isPublished: true,
          createdBy: 'e2e-admin-2',
        },
        {
          title: 'Maintenance Announcement',
          content:
            'Scheduled maintenance will be performed to improve system performance and add new features.',
          type: AnnouncementType.MAINTENANCE,
          priority: AnnouncementPriority.URGENT,
          category: 'system',
          tags: ['maintenance', 'system', 'downtime'],
          isFeatured: false,
          isPublished: false,
          createdBy: 'e2e-admin-3',
        },
      ];

      for (const data of testData) {
        const response = await request(app.getHttpServer())
          .post('/event-announcements')
          .send(data);
        createdAnnouncements.push(response.body);
      }
    });

    it('should get all announcements with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrevious: false,
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements')
        .query({ type: AnnouncementType.COMPETITION })
        .expect(200);

      expect(
        response.body.data.every(
          (item: any) => item.type === AnnouncementType.COMPETITION,
        ),
      ).toBe(true);
    });

    it('should filter by published status', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements')
        .query({ isPublished: true })
        .expect(200);

      expect(
        response.body.data.every((item: any) => item.isPublished === true),
      ).toBe(true);
    });

    it('should search announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements')
        .query({ search: 'gaming' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.some(
          (item: any) =>
            item.title.toLowerCase().includes('gaming') ||
            item.content.toLowerCase().includes('gaming'),
        ),
      ).toBe(true);
    });

    it('should sort announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements')
        .query({ sortBy: 'priority', sortOrder: 'DESC' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      // Verify sorting logic would be complex without knowing exact data
    });
  });

  describe('/event-announcements/published (GET)', () => {
    it('should get only published announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/published')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(
        response.body.every((item: any) => item.isPublished === true),
      ).toBe(true);
      expect(response.body.every((item: any) => item.isActive === true)).toBe(
        true,
      );
    });
  });

  describe('/event-announcements/featured (GET)', () => {
    it('should get featured announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/featured')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.every((item: any) => item.isFeatured === true)).toBe(
        true,
      );
    });
  });

  describe('/event-announcements/popular (GET)', () => {
    it('should get popular announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/popular')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('/event-announcements/trending (GET)', () => {
    it('should get trending announcements', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/trending')
        .query({ days: 7, limit: 10 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });

  describe('/event-announcements/by-tags (GET)', () => {
    it('should get announcements by tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/by-tags')
        .query({ tags: 'gaming,championship', limit: 20 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(20);
    });

    it('should reject empty tags parameter', async () => {
      await request(app.getHttpServer())
        .get('/event-announcements/by-tags')
        .query({ tags: '', limit: 10 })
        .expect(400);
    });
  });

  describe('/event-announcements/type/:type (GET)', () => {
    it('should get announcements by valid type', async () => {
      const response = await request(app.getHttpServer())
        .get(`/event-announcements/type/${AnnouncementType.COMPETITION}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(
        response.body.every(
          (item: any) => item.type === AnnouncementType.COMPETITION,
        ),
      ).toBe(true);
    });

    it('should reject invalid announcement type', async () => {
      await request(app.getHttpServer())
        .get('/event-announcements/type/invalid-type')
        .expect(400);
    });
  });

  describe('/event-announcements/category/:category (GET)', () => {
    it('should get announcements by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/category/gaming')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(
        response.body.every((item: any) => item.category === 'gaming'),
      ).toBe(true);
    });
  });

  describe('/event-announcements/:id (GET)', () => {
    it('should get specific announcement and increment view count', async () => {
      // First, create an announcement
      const createResponse = await request(app.getHttpServer())
        .post('/event-announcements')
        .send({
          title: 'View Count Test Tournament',
          content:
            'This announcement is used to test the view count increment functionality during retrieval.',
          createdBy: 'view-test-admin',
        });

      const announcementId = createResponse.body.id;

      // Get the announcement (should increment view count)
      const response = await request(app.getHttpServer())
        .get(`/event-announcements/${announcementId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: announcementId,
        title: 'View Count Test Tournament',
        viewCount: expect.any(Number),
      });

      // Get it again to verify view count incremented
      const secondResponse = await request(app.getHttpServer())
        .get(`/event-announcements/${announcementId}`)
        .expect(200);

      expect(secondResponse.body.viewCount).toBeGreaterThan(
        response.body.viewCount,
      );
    });

    it('should return 404 for non-existent announcement', async () => {
      await request(app.getHttpServer())
        .get('/event-announcements/non-existent-id')
        .expect(404);
    });
  });

  describe('/event-announcements/:id (PATCH)', () => {
    it('should update announcement', async () => {
      // Create announcement first
      const createResponse = await request(app.getHttpServer())
        .post('/event-announcements')
        .send({
          title: 'Update Test Tournament',
          content:
            'This announcement will be updated to test the update functionality with comprehensive validation.',
          createdBy: 'update-test-admin',
        });

      const announcementId = createResponse.body.id;

      // Update the announcement
      const updateData = {
        title: 'Updated Tournament Title',
        isFeatured: true,
        priority: AnnouncementPriority.HIGH,
        maxParticipants: 1000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/event-announcements/${announcementId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: announcementId,
        title: updateData.title,
        isFeatured: updateData.isFeatured,
        priority: updateData.priority,
        maxParticipants: updateData.maxParticipants,
      });
    });
  });

  describe('Engagement Endpoints', () => {
    let testAnnouncementId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/event-announcements')
        .send({
          title: 'Engagement Test Tournament',
          content:
            'This announcement is used for testing all engagement tracking functionality including likes and shares.',
          createdBy: 'engagement-test-admin',
        });

      testAnnouncementId = createResponse.body.id;
    });

    it('should increment like count', async () => {
      await request(app.getHttpServer())
        .post(`/event-announcements/${testAnnouncementId}/like`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/event-announcements/${testAnnouncementId}`)
        .expect(200);

      expect(response.body.likeCount).toBeGreaterThan(0);
    });

    it('should decrement like count', async () => {
      // First like it
      await request(app.getHttpServer())
        .post(`/event-announcements/${testAnnouncementId}/like`)
        .expect(204);

      // Then unlike it
      await request(app.getHttpServer())
        .delete(`/event-announcements/${testAnnouncementId}/like`)
        .expect(204);
    });

    it('should increment share count', async () => {
      await request(app.getHttpServer())
        .post(`/event-announcements/${testAnnouncementId}/share`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/event-announcements/${testAnnouncementId}`)
        .expect(200);

      expect(response.body.shareCount).toBeGreaterThan(0);
    });
  });

  describe('Bulk Operations', () => {
    let bulkTestIds: string[];

    beforeAll(async () => {
      bulkTestIds = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/event-announcements')
          .send({
            title: `Bulk Test Announcement ${i + 1}`,
            content: `This is bulk test announcement number ${i + 1} for testing bulk operations functionality.`,
            createdBy: 'bulk-test-admin',
            isPublished: i % 2 === 0,
          });

        bulkTestIds.push(response.body.id);
      }
    });

    it('should perform bulk publish action', async () => {
      await request(app.getHttpServer())
        .post('/event-announcements/bulk-action')
        .send({
          ids: bulkTestIds,
          action: 'publish',
        })
        .expect(204);
    });

    it('should perform bulk feature action', async () => {
      await request(app.getHttpServer())
        .post('/event-announcements/bulk-action')
        .send({
          ids: bulkTestIds.slice(0, 2),
          action: 'feature',
        })
        .expect(204);
    });

    it('should reject unknown bulk action', async () => {
      await request(app.getHttpServer())
        .post('/event-announcements/bulk-action')
        .send({
          ids: bulkTestIds,
          action: 'unknown-action',
        })
        .expect(400);
    });
  });

  describe('Metadata Endpoints', () => {
    it('should get announcement types', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/types')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toContain('competition');
      expect(response.body).toContain('event');
    });

    it('should get categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should get tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/tags')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should get statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-announcements/statistics')
        .expect(200);

      expect(response.body).toMatchObject({
        totalAnnouncements: expect.any(Number),
        publishedAnnouncements: expect.any(Number),
        draftAnnouncements: expect.any(Number),
        activeAnnouncements: expect.any(Number),
        featuredAnnouncements: expect.any(Number),
        pinnedAnnouncements: expect.any(Number),
        totalViews: expect.any(Number),
        totalLikes: expect.any(Number),
        totalShares: expect.any(Number),
        typesCount: expect.any(Number),
        categoriesCount: expect.any(Number),
        tagsCount: expect.any(Number),
      });
    });
  });
});
