import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as request from 'supertest';
import { StarknetNewsModule } from './starknet-news.module';
import { StarknetNews } from './entities/news.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('StarkNet News E2E Tests', () => {
  let app: INestApplication;
  let repository: Repository<StarknetNews>;
  let httpServer: any;

  const baseNewsData = {
    title: 'StarkNet E2E Test: Revolutionary Blockchain Scaling Solution',
    content:
      'This comprehensive end-to-end test article validates the complete HTTP API functionality including creation, reading, updating, deletion, and all advanced features like engagement tracking, analytics, and bulk operations across the entire application stack.',
    summary: 'Complete E2E test for StarkNet news API functionality',
    excerpt: 'Full API testing with comprehensive validation',
    category: 'testing',
    tags: ['e2e', 'testing', 'starknet', 'api', 'validation'],
    priority: 'high',
    isPublished: true,
    isFeatured: false,
    allowComments: true,
    author: 'E2E Test Suite',
    metaTitle: 'E2E Testing: StarkNet News API Validation',
    metaDescription:
      'Comprehensive end-to-end testing of StarkNet news API functionality',
    metaKeywords: ['e2e', 'testing', 'api', 'starknet'],
    slug: 'starknet-e2e-test-api-validation',
    readingTimeMinutes: 10,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [StarknetNews],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        ScheduleModule.forRoot(),
        StarknetNewsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure validation pipe as in real application
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    httpServer = app.getHttpServer();
    repository = moduleFixture.get<Repository<StarknetNews>>(
      getRepositoryToken(StarknetNews),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('POST /starknet-news', () => {
    it('should create a news article successfully', async () => {
      const response = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: baseNewsData.title,
        content: baseNewsData.content,
        category: baseNewsData.category,
        tags: baseNewsData.tags,
        priority: baseNewsData.priority,
        isPublished: baseNewsData.isPublished,
        slug: expect.any(String),
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(response.body.publishedAt).toBeDefined();
      expect(response.body.readingTimeMinutes).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: 'Short', // Too short
        content: 'Brief', // Too short
      };

      await request(httpServer)
        .post('/starknet-news')
        .send(invalidData)
        .expect(400);
    });

    it('should sanitize malicious content', async () => {
      const maliciousData = {
        ...baseNewsData,
        title: 'Test <script>alert("xss")</script>Title',
        content:
          'Content with <script>alert("hack")</script> and <iframe src="evil.com"></iframe> tags',
      };

      const response = await request(httpServer)
        .post('/starknet-news')
        .send(maliciousData)
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
      expect(response.body.content).not.toContain('<script>');
      expect(response.body.content).not.toContain('<iframe>');
    });

    it('should generate unique slugs automatically', async () => {
      // Create first article
      const response1 = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData)
        .expect(201);

      // Create second article with same title
      const response2 = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData)
        .expect(201);

      expect(response1.body.slug).toBe('starknet-e2e-test-api-validation');
      expect(response2.body.slug).toBe('starknet-e2e-test-api-validation-1');
    });
  });

  describe('GET /starknet-news', () => {
    beforeEach(async () => {
      // Seed test data
      const testArticles = [
        {
          ...baseNewsData,
          title: 'StarkNet Technology Update',
          category: 'technology',
          tags: ['starknet', 'tech', 'update'],
          priority: 'high',
          viewCount: 1500,
          likeCount: 200,
        },
        {
          ...baseNewsData,
          title: 'DeFi Protocol Innovation',
          category: 'defi',
          tags: ['defi', 'protocols', 'innovation'],
          priority: 'normal',
          viewCount: 800,
          likeCount: 120,
          isPublished: false, // Draft
        },
        {
          ...baseNewsData,
          title: 'NFT Marketplace Launch',
          category: 'nft',
          tags: ['nft', 'marketplace', 'launch'],
          priority: 'urgent',
          viewCount: 2000,
          likeCount: 350,
          isFeatured: true,
        },
      ];

      for (const article of testArticles) {
        await request(httpServer).post('/starknet-news').send(article);
      }
    });

    it('should return paginated news articles', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 2,
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrevious: false,
      });

      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should filter by category', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ category: 'technology', isPublished: true })
        .expect(200);

      expect(
        response.body.data.every(
          (article: any) =>
            article.category === 'technology' && article.isPublished === true,
        ),
      ).toBe(true);
    });

    it('should filter by tags', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ tags: ['starknet', 'tech'] })
        .expect(200);

      expect(
        response.body.data.every((article: any) =>
          article.tags.some((tag: string) =>
            ['starknet', 'tech'].includes(tag),
          ),
        ),
      ).toBe(true);
    });

    it('should perform full-text search', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ search: 'StarkNet technology' })
        .expect(200);

      if (response.body.total > 0) {
        expect(
          response.body.data.some(
            (article: any) =>
              article.title.toLowerCase().includes('starknet') ||
              article.content.toLowerCase().includes('technology'),
          ),
        ).toBe(true);
      }
    });

    it('should sort by different fields', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ sortBy: 'viewCount', sortOrder: 'DESC', isPublished: true })
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          expect(response.body.data[i - 1].viewCount).toBeGreaterThanOrEqual(
            response.body.data[i].viewCount,
          );
        }
      }
    });

    it('should filter by engagement metrics', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ minViews: 1000, minLikes: 100 })
        .expect(200);

      expect(
        response.body.data.every(
          (article: any) =>
            article.viewCount >= 1000 && article.likeCount >= 100,
        ),
      ).toBe(true);
    });
  });

  describe('GET /starknet-news/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const response = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData);
      articleId = response.body.id;
    });

    it('should return single article and increment view count', async () => {
      // Get initial view count
      const initialResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      const initialViews = initialResponse.body.viewCount;

      // Access again to increment view count
      const secondResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(secondResponse.body.viewCount).toBeGreaterThan(initialViews);
      expect(secondResponse.body.id).toBe(articleId);
    });

    it('should return 404 for non-existent article', async () => {
      await request(httpServer)
        .get('/starknet-news/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });
  });

  describe('PATCH /starknet-news/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const response = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData);
      articleId = response.body.id;
    });

    it('should update article successfully', async () => {
      const updateData = {
        title: 'Updated: E2E Test Article',
        isFeatured: true,
        priority: 'urgent',
        tags: ['updated', 'e2e', 'test'],
      };

      const response = await request(httpServer)
        .patch(`/starknet-news/${articleId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: articleId,
        title: updateData.title,
        isFeatured: updateData.isFeatured,
        priority: updateData.priority,
        tags: updateData.tags,
      });
    });

    it('should handle publication status changes', async () => {
      // Unpublish
      await request(httpServer)
        .patch(`/starknet-news/${articleId}`)
        .send({ isPublished: false })
        .expect(200);

      // Verify unpublished
      const unpublishedResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(unpublishedResponse.body.isPublished).toBe(false);
      expect(unpublishedResponse.body.publishedAt).toBeNull();

      // Republish
      await request(httpServer)
        .patch(`/starknet-news/${articleId}`)
        .send({ isPublished: true })
        .expect(200);

      // Verify republished
      const republishedResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(republishedResponse.body.isPublished).toBe(true);
      expect(republishedResponse.body.publishedAt).toBeDefined();
    });
  });

  describe('DELETE /starknet-news/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const response = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData);
      articleId = response.body.id;
    });

    it('should soft delete article', async () => {
      await request(httpServer)
        .delete(`/starknet-news/${articleId}`)
        .expect(204);

      // Article should not be found in normal queries
      await request(httpServer).get(`/starknet-news/${articleId}`).expect(404);

      // But should be found when including deleted
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ includeDeleted: true });

      const deletedArticle = response.body.data.find(
        (a: any) => a.id === articleId,
      );
      expect(deletedArticle?.deletedAt).toBeDefined();
    });
  });

  describe('Content Discovery Endpoints', () => {
    beforeEach(async () => {
      // Create test articles with different properties
      const articles = [
        {
          ...baseNewsData,
          title: 'Published Article 1',
          isPublished: true,
          isFeatured: false,
        },
        {
          ...baseNewsData,
          title: 'Featured Article',
          isPublished: true,
          isFeatured: true,
        },
        {
          ...baseNewsData,
          title: 'Popular Article',
          isPublished: true,
          viewCount: 5000,
          likeCount: 800,
        },
        { ...baseNewsData, title: 'Draft Article', isPublished: false },
      ];

      for (const article of articles) {
        await request(httpServer).post('/starknet-news').send(article);
      }
    });

    it('GET /starknet-news/published should return only published articles', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/published')
        .expect(200);

      expect(
        response.body.every((article: any) => article.isPublished === true),
      ).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /starknet-news/featured should return only featured articles', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/featured')
        .expect(200);

      expect(
        response.body.every(
          (article: any) =>
            article.isFeatured === true && article.isPublished === true,
        ),
      ).toBe(true);
    });

    it('GET /starknet-news/popular should return articles sorted by engagement', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/popular')
        .query({ limit: 5 })
        .expect(200);

      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          expect(response.body[i - 1].viewCount).toBeGreaterThanOrEqual(
            response.body[i].viewCount,
          );
        }
      }
    });

    it('GET /starknet-news/trending should return recent popular articles', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/trending')
        .query({ days: 30, limit: 10 })
        .expect(200);

      expect(
        response.body.every((article: any) => article.isPublished === true),
      ).toBe(true);
    });

    it('GET /starknet-news/categories should return available categories', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('testing');
    });

    it('GET /starknet-news/tags should return available tags', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/tags')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some((tag: string) =>
          ['e2e', 'testing', 'starknet'].includes(tag),
        ),
      ).toBe(true);
    });

    it('GET /starknet-news/statistics should return comprehensive stats', async () => {
      const response = await request(httpServer)
        .get('/starknet-news/statistics')
        .expect(200);

      expect(response.body).toMatchObject({
        totalNews: expect.any(Number),
        publishedNews: expect.any(Number),
        draftNews: expect.any(Number),
        totalViews: expect.any(Number),
        totalLikes: expect.any(Number),
        totalShares: expect.any(Number),
        categoriesCount: expect.any(Number),
        tagsCount: expect.any(Number),
      });

      expect(response.body.totalNews).toBeGreaterThan(0);
    });
  });

  describe('Engagement Tracking Endpoints', () => {
    let articleId: string;

    beforeEach(async () => {
      const response = await request(httpServer)
        .post('/starknet-news')
        .send(baseNewsData);
      articleId = response.body.id;
    });

    it('POST /starknet-news/:id/view should increment view count', async () => {
      const initialResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      const initialViews = initialResponse.body.viewCount;

      await request(httpServer)
        .post(`/starknet-news/${articleId}/view`)
        .expect(204);

      const updatedResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(updatedResponse.body.viewCount).toBeGreaterThan(initialViews);
    });

    it('POST /starknet-news/:id/like should increment like count', async () => {
      const initialResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      const initialLikes = initialResponse.body.likeCount;

      await request(httpServer)
        .post(`/starknet-news/${articleId}/like`)
        .expect(204);

      const updatedResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(updatedResponse.body.likeCount).toBe(initialLikes + 1);
    });

    it('DELETE /starknet-news/:id/like should decrement like count', async () => {
      // First add a like
      await request(httpServer)
        .post(`/starknet-news/${articleId}/like`)
        .expect(204);

      const beforeUnlikeResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      const beforeUnlike = beforeUnlikeResponse.body.likeCount;

      // Then remove it
      await request(httpServer)
        .delete(`/starknet-news/${articleId}/like`)
        .expect(204);

      const afterUnlikeResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(afterUnlikeResponse.body.likeCount).toBe(beforeUnlike - 1);
    });

    it('POST /starknet-news/:id/share should increment share count', async () => {
      const initialResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      const initialShares = initialResponse.body.shareCount;

      await request(httpServer)
        .post(`/starknet-news/${articleId}/share`)
        .expect(204);

      const updatedResponse = await request(httpServer)
        .get(`/starknet-news/${articleId}`)
        .expect(200);

      expect(updatedResponse.body.shareCount).toBe(initialShares + 1);
    });
  });

  describe('Admin Operations', () => {
    let articleIds: string[];

    beforeEach(async () => {
      articleIds = [];

      // Create multiple test articles
      for (let i = 0; i < 3; i++) {
        const response = await request(httpServer)
          .post('/starknet-news')
          .send({
            ...baseNewsData,
            title: `Admin Test Article ${i + 1}`,
          });
        articleIds.push(response.body.id);
      }
    });

    it('PUT /starknet-news/:id/restore should restore soft-deleted article', async () => {
      const articleId = articleIds[0];

      // First delete the article
      await request(httpServer)
        .delete(`/starknet-news/${articleId}`)
        .expect(204);

      // Verify it's deleted
      await request(httpServer).get(`/starknet-news/${articleId}`).expect(404);

      // Restore it
      const restoreResponse = await request(httpServer)
        .put(`/starknet-news/${articleId}/restore`)
        .expect(200);

      expect(restoreResponse.body.id).toBe(articleId);
      expect(restoreResponse.body.deletedAt).toBeNull();

      // Verify it's accessible again
      await request(httpServer).get(`/starknet-news/${articleId}`).expect(200);
    });

    it('DELETE /starknet-news/:id/hard should permanently delete article', async () => {
      const articleId = articleIds[0];

      await request(httpServer)
        .delete(`/starknet-news/${articleId}/hard`)
        .expect(204);

      // Should not be found even with includeDeleted
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ includeDeleted: true });

      const foundArticle = response.body.data.find(
        (a: any) => a.id === articleId,
      );
      expect(foundArticle).toBeUndefined();
    });

    it('POST /starknet-news/bulk/action should perform bulk operations', async () => {
      // Test bulk publish
      await request(httpServer)
        .post('/starknet-news/bulk/action')
        .send({
          ids: articleIds,
          action: 'publish',
        })
        .expect(204);

      // Verify all are published
      for (const id of articleIds) {
        const response = await request(httpServer)
          .get(`/starknet-news/${id}`)
          .expect(200);
        expect(response.body.isPublished).toBe(true);
      }

      // Test bulk feature
      await request(httpServer)
        .post('/starknet-news/bulk/action')
        .send({
          ids: articleIds.slice(0, 2),
          action: 'feature',
        })
        .expect(204);

      // Verify featured status
      for (const id of articleIds.slice(0, 2)) {
        const response = await request(httpServer)
          .get(`/starknet-news/${id}`)
          .expect(200);
        expect(response.body.isFeatured).toBe(true);
      }

      // Test bulk delete
      await request(httpServer)
        .post('/starknet-news/bulk/action')
        .send({
          ids: [articleIds[2]],
          action: 'delete',
        })
        .expect(204);

      // Verify deletion
      await request(httpServer)
        .get(`/starknet-news/${articleIds[2]}`)
        .expect(404);
    });

    it('should reject unknown bulk actions', async () => {
      await request(httpServer)
        .post('/starknet-news/bulk/action')
        .send({
          ids: articleIds,
          action: 'unknown-action',
        })
        .expect(500); // Internal server error due to unknown action
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors properly', async () => {
      const invalidData = {
        title: '', // Empty title
        content: '', // Empty content
        priority: 'invalid-priority', // Invalid enum value
        tags: new Array(15).fill('tag'), // Too many tags
      };

      const response = await request(httpServer)
        .post('/starknet-news')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should handle UUID validation for parameters', async () => {
      await request(httpServer).get('/starknet-news/invalid-uuid').expect(400);

      await request(httpServer)
        .patch('/starknet-news/invalid-uuid')
        .send({ title: 'Updated Title' })
        .expect(400);
    });

    it('should handle numeric parameter validation', async () => {
      await request(httpServer)
        .get('/starknet-news/popular')
        .query({ limit: 'invalid-number' })
        .expect(400);

      await request(httpServer)
        .get('/starknet-news/trending')
        .query({ days: 'invalid-number' })
        .expect(400);
    });
  });

  describe('Performance and Pagination', () => {
    beforeEach(async () => {
      // Create multiple articles for pagination testing
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          request(httpServer)
            .post('/starknet-news')
            .send({
              ...baseNewsData,
              title: `Performance Test Article ${i + 1}`,
              viewCount: Math.floor(Math.random() * 1000),
              likeCount: Math.floor(Math.random() * 100),
            }),
        );
      }
      await Promise.all(promises);
    });

    it('should handle large result sets with pagination', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBe(10);
      expect(response.body.total).toBe(25);
      expect(response.body.totalPages).toBe(3);
      expect(response.body.hasNext).toBe(true);
      expect(response.body.hasPrevious).toBe(false);
    });

    it('should handle last page pagination correctly', async () => {
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ page: 3, limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBe(5); // Last 5 articles
      expect(response.body.page).toBe(3);
      expect(response.body.hasNext).toBe(false);
      expect(response.body.hasPrevious).toBe(true);
    });

    it('should respect limit constraints', async () => {
      // Test max limit enforcement
      const response = await request(httpServer)
        .get('/starknet-news')
        .query({ limit: 150 }) // Exceeds max of 100
        .expect(400);

      expect(response.body.message).toContain(
        'limit must not be greater than 100',
      );
    });
  });
});
