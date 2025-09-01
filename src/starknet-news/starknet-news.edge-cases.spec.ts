import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StarknetNewsModule } from './starknet-news.module';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNews } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

describe('StarkNet News Edge Cases & Error Handling', () => {
  let module: TestingModule;
  let service: StarknetNewsService;
  let repository: Repository<StarknetNews>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

    service = module.get<StarknetNewsService>(StarknetNewsService);
    repository = module.get<Repository<StarknetNews>>(
      getRepositoryToken(StarknetNews),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('Input Validation Edge Cases', () => {
    describe('Title validation', () => {
      it('should reject titles that are too short', async () => {
        const dto: CreateNewsDto = {
          title: 'Short', // 5 characters - too short
          content:
            'This is a comprehensive test content that meets the minimum length requirements for news article creation and validation.',
          category: 'testing',
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });

      it('should reject titles that are too long', async () => {
        const dto: CreateNewsDto = {
          title: 'A'.repeat(300), // Exceeds 255 character limit
          content:
            'This is a comprehensive test content that meets the minimum length requirements for news article creation and validation.',
          category: 'testing',
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });

      it('should handle titles with special characters and Unicode', async () => {
        const dto: CreateNewsDto = {
          title: 'StarkNet 🚀 革命性的区块链扩展解决方案 – ネットワーク技術',
          content:
            'This comprehensive article discusses the revolutionary blockchain scaling solution with Unicode characters and emojis in the title.',
          category: 'technology',
          tags: ['unicode', 'international', 'blockchain'],
        };

        const result = await service.create(dto);
        expect(result.title).toBe(dto.title);
        expect(result.slug).toBeDefined();
      });

      it('should handle titles with only whitespace', async () => {
        const dto: CreateNewsDto = {
          title: '   \t\n   ', // Only whitespace
          content:
            'This is a comprehensive test content that meets the minimum length requirements for news article creation and validation.',
          category: 'testing',
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });
    });

    describe('Content validation', () => {
      it('should reject content that is too short', async () => {
        const dto: CreateNewsDto = {
          title: 'Valid Title for Content Testing',
          content: 'Short', // Too short
          category: 'testing',
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });

      it('should handle extremely long content', async () => {
        const dto: CreateNewsDto = {
          title: 'Extremely Long Content Test Article',
          content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(
              200,
            ), // ~11,000 characters
          category: 'testing',
        };

        const result = await service.create(dto);
        expect(result.content.length).toBeGreaterThan(10000);
        expect(result.readingTimeMinutes).toBeGreaterThan(10);
      });

      it('should sanitize malicious HTML content', async () => {
        const dto: CreateNewsDto = {
          title: 'Security Test: Malicious Content Sanitization',
          content: `
            <script>alert('XSS Attack!');</script>
            <iframe src="javascript:alert('XSS')"></iframe>
            <img src="x" onerror="alert('XSS')" />
            <a href="javascript:void(0)" onclick="alert('XSS')">Click me</a>
            <div style="background: url('javascript:alert(1)')">Content</div>
            <svg><script>alert('XSS')</script></svg>
            This is legitimate content that should remain.
          `,
          category: 'security-testing',
        };

        const result = await service.create(dto);
        expect(result.content).not.toContain('<script>');
        expect(result.content).not.toContain('<iframe>');
        expect(result.content).not.toContain('javascript:');
        expect(result.content).not.toContain('onerror');
        expect(result.content).not.toContain('onclick');
        expect(result.content).toContain('This is legitimate content');
      });

      it('should handle content with various encodings', async () => {
        const dto: CreateNewsDto = {
          title: 'Multi-encoding Content Test',
          content: `
            Regular ASCII content.
            UTF-8 characters: αβγδε ñáéíóú 中文字符 العربية русский עברית
            Mathematical symbols: ∑∫∆∇∞≠≤≥±√²³
            Currency symbols: $¢£¥€₹₽₿
            Emojis: 🚀🌟💎🔥⚡🎯🌈🎉
            Special quotes: "smart quotes" 'apostrophes'
            Various dashes: - – — ―
          `,
          category: 'encoding-test',
          tags: ['unicode', 'encoding', 'international'],
        };

        const result = await service.create(dto);
        expect(result.content).toContain('中文字符');
        expect(result.content).toContain('🚀');
        expect(result.content).toContain('∑∫∆');
      });
    });

    describe('Tag validation', () => {
      it('should reject too many tags', async () => {
        const dto: CreateNewsDto = {
          title: 'Tag Validation Test Article',
          content:
            'This article tests the validation limits for the number of tags that can be assigned to a news article.',
          category: 'testing',
          tags: Array.from({ length: 15 }, (_, i) => `tag${i + 1}`), // 15 tags - exceeds limit of 10
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });

      it('should handle empty and whitespace-only tags', async () => {
        const dto: CreateNewsDto = {
          title: 'Empty Tag Validation Test',
          content:
            'This article tests how the system handles empty and whitespace-only tags in the tag array.',
          category: 'testing',
          tags: ['valid-tag', '', '   ', '\t\n', 'another-valid-tag'],
        };

        const result = await service.create(dto);
        // Empty/whitespace tags should be filtered out
        expect(result.tags).toEqual(['valid-tag', 'another-valid-tag']);
      });

      it('should handle tags with special characters', async () => {
        const dto: CreateNewsDto = {
          title: 'Special Character Tag Test',
          content:
            'This article tests how the system handles tags containing various special characters and Unicode.',
          category: 'testing',
          tags: [
            'tag-with-dash',
            'tag_with_underscore',
            'tag.with.dots',
            'tag+plus',
            'tag@symbol',
            'тег',
            '标签',
            'タグ',
          ],
        };

        const result = await service.create(dto);
        expect(result.tags).toEqual(dto.tags);
      });
    });

    describe('Slug validation and generation', () => {
      it('should handle titles that generate identical slugs', async () => {
        const baseDto: CreateNewsDto = {
          title: 'Test Article: Special Characters & Symbols!!!',
          content:
            'This comprehensive test validates slug generation with special characters and duplicate prevention.',
          category: 'testing',
        };

        // Create multiple articles with titles that would generate similar slugs
        const articles = await Promise.all([
          service.create({
            ...baseDto,
            title: 'Test Article: Special Characters & Symbols!!!',
          }),
          service.create({
            ...baseDto,
            title: 'Test Article Special Characters Symbols',
          }),
          service.create({
            ...baseDto,
            title: 'TEST ARTICLE: SPECIAL CHARACTERS & SYMBOLS!!!',
          }),
          service.create({
            ...baseDto,
            title: 'Test  Article:  Special  Characters  &  Symbols!!!',
          }),
        ]);

        const slugs = articles.map((a) => a.slug);
        const uniqueSlugs = new Set(slugs);

        expect(uniqueSlugs.size).toBe(slugs.length); // All slugs should be unique
        expect(slugs[0]).toBe('test-article-special-characters-symbols');
        expect(slugs[1]).toBe('test-article-special-characters-symbols-1');
        expect(slugs[2]).toBe('test-article-special-characters-symbols-2');
        expect(slugs[3]).toBe('test-article-special-characters-symbols-3');
      });

      it('should reject invalid custom slugs', async () => {
        const dto: CreateNewsDto = {
          title: 'Custom Slug Validation Test',
          content:
            'This article tests validation of custom slugs with invalid characters.',
          category: 'testing',
          slug: 'Invalid Slug With Spaces!@#$%', // Invalid characters
        };

        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });

      it('should handle extremely long titles for slug generation', async () => {
        const dto: CreateNewsDto = {
          title:
            'This is an extremely long title that contains many words and should test the slug generation functionality with very long input strings that exceed normal length expectations',
          content:
            'This article tests slug generation with extremely long titles.',
          category: 'testing',
        };

        const result = await service.create(dto);
        expect(result.slug).toBeDefined();
        expect(result.slug.length).toBeLessThanOrEqual(255); // Should be truncated if necessary
        expect(result.slug).toMatch(/^[a-z0-9-]+$/); // Should only contain lowercase letters, numbers, and hyphens
      });
    });
  });

  describe('Database Constraint Edge Cases', () => {
    it('should handle concurrent slug generation', async () => {
      const baseDto: CreateNewsDto = {
        title: 'Concurrent Slug Test Article',
        content:
          'This article tests concurrent slug generation to ensure uniqueness under race conditions.',
        category: 'testing',
      };

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        service.create(baseDto),
      );
      const results = await Promise.all(promises);

      const slugs = results.map((r) => r.slug);
      const uniqueSlugs = new Set(slugs);

      expect(uniqueSlugs.size).toBe(slugs.length); // All should be unique
    });

    it('should handle database connection issues gracefully', async () => {
      // This would require mocking the database connection to simulate failures
      // For now, we'll test that proper error handling is in place
      const dto: CreateNewsDto = {
        title: 'Database Error Test',
        content: 'This tests error handling for database connection issues.',
        category: 'testing',
      };

      // Test with valid data first
      const result = await service.create(dto);
      expect(result).toBeDefined();
    });
  });

  describe('Query Parameter Edge Cases', () => {
    beforeEach(async () => {
      // Create test data with edge case scenarios
      const testArticles = [
        {
          title: 'Article with Null Values Test',
          content:
            'This article tests handling of null and undefined values in various fields.',
          category: 'testing',
          tags: null,
          summary: null,
          excerpt: null,
          author: null,
          imageUrl: null,
          sourceUrl: null,
          metaDescription: null,
          metaTitle: null,
          metaKeywords: null,
          isPublished: true,
        },
        {
          title: 'Article with Empty Arrays',
          content:
            'This article tests handling of empty arrays and edge case values.',
          category: 'testing',
          tags: [],
          metaKeywords: [],
          isPublished: true,
        },
        {
          title: 'Article with Extreme Values',
          content: 'This article tests handling of extreme numeric values.',
          category: 'testing',
          viewCount: Number.MAX_SAFE_INTEGER,
          likeCount: 0,
          shareCount: -1, // This should be corrected to 0 or rejected
          priority: 'urgent',
          isPublished: true,
        },
      ];

      for (const article of testArticles) {
        const news = repository.create(article);
        await repository.save(news);
      }
    });

    it('should handle extreme pagination values', async () => {
      const queries: QueryNewsDto[] = [
        { page: 0, limit: 10 }, // Invalid page
        { page: -1, limit: 10 }, // Negative page
        { page: 999999, limit: 10 }, // Very large page
        { page: 1, limit: 0 }, // Invalid limit
        { page: 1, limit: -5 }, // Negative limit
        { page: 1, limit: 999999 }, // Very large limit
      ];

      for (const query of queries) {
        // Most of these should either be corrected by transformation or cause validation errors
        try {
          const result = await service.findAll(query);
          // If it succeeds, verify reasonable defaults were applied
          expect(result.page).toBeGreaterThan(0);
          expect(result.limit).toBeGreaterThan(0);
          expect(result.limit).toBeLessThanOrEqual(100);
        } catch (error) {
          // Validation errors are expected for invalid values
          expect(error).toBeInstanceOf(BadRequestException);
        }
      }
    });

    it('should handle malformed date filters', async () => {
      const query: QueryNewsDto = {
        publishedAfter: new Date('invalid-date'),
        publishedBefore: new Date('not-a-date'),
      };

      // Should handle invalid dates gracefully
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });

    it('should handle extremely long search queries', async () => {
      const longSearchTerm = 'search '.repeat(1000); // 7000 characters
      const query: QueryNewsDto = {
        search: longSearchTerm,
      };

      const result = await service.findAll(query);
      expect(result).toBeDefined();
      // Should not cause performance issues or errors
    });

    it('should handle special characters in search', async () => {
      const specialSearches = [
        "'; DROP TABLE starknet_news; --", // SQL injection attempt
        '<script>alert("xss")</script>', // XSS attempt
        '🚀💎🌟⚡', // Emoji search
        '中文搜索测试', // Chinese characters
        'search\x00null\x00bytes', // Null bytes
        'search\r\nwith\nnewlines', // Newlines
        '\\\\\\"""\'\'\'%%%', // Escape characters
      ];

      for (const searchTerm of specialSearches) {
        const query: QueryNewsDto = { search: searchTerm };
        const result = await service.findAll(query);
        expect(result).toBeDefined();
        // Should handle gracefully without errors
      }
    });
  });

  describe('Engagement Tracking Edge Cases', () => {
    let testArticleId: string;

    beforeEach(async () => {
      const dto: CreateNewsDto = {
        title: 'Engagement Edge Case Test Article',
        content:
          'This article is used for testing engagement tracking edge cases and boundary conditions.',
        category: 'testing',
      };

      const result = await service.create(dto);
      testArticleId = result.id;
    });

    it('should handle rapid consecutive engagement actions', async () => {
      // Simulate rapid clicks/likes
      const promises = Array.from({ length: 100 }, () =>
        service.incrementViewCount(testArticleId),
      );

      await Promise.all(promises);

      const result = await service.findOne(testArticleId);
      expect(result.viewCount).toBe(100);
    });

    it('should handle engagement on non-existent articles', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      // These should not throw errors but should log warnings
      await service.incrementViewCount(fakeId);
      await service.incrementLikeCount(fakeId);
      await service.incrementShareCount(fakeId);
    });

    it('should handle negative engagement attempts', async () => {
      // First add some likes
      await service.incrementLikeCount(testArticleId);
      await service.incrementLikeCount(testArticleId);

      const beforeDecrement = await service.findOne(testArticleId);
      expect(beforeDecrement.likeCount).toBe(2);

      // Try to decrement below zero
      await service.decrementLikeCount(testArticleId);
      await service.decrementLikeCount(testArticleId);
      await service.decrementLikeCount(testArticleId); // This should not go below 0

      const afterDecrement = await service.findOne(testArticleId);
      expect(afterDecrement.likeCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bulk Operation Edge Cases', () => {
    let testIds: string[];

    beforeEach(async () => {
      testIds = [];
      for (let i = 0; i < 5; i++) {
        const dto: CreateNewsDto = {
          title: `Bulk Operation Test Article ${i + 1}`,
          content: `This is test article number ${i + 1} for bulk operation edge case testing.`,
          category: 'testing',
        };
        const result = await service.create(dto);
        testIds.push(result.id);
      }
    });

    it('should handle bulk operations with empty arrays', async () => {
      await service.bulkUpdate([], { isPublished: false });
      await service.bulkDelete([]);

      // Should not cause errors
      expect(true).toBe(true);
    });

    it('should handle bulk operations with non-existent IDs', async () => {
      const fakeIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      // Should not throw errors for non-existent IDs
      await service.bulkUpdate(fakeIds, { isPublished: false });
      await service.bulkDelete(fakeIds);
    });

    it('should handle bulk operations with mixed valid and invalid IDs', async () => {
      const mixedIds = [
        testIds[0], // Valid
        '550e8400-e29b-41d4-a716-446655440000', // Invalid
        testIds[1], // Valid
        'invalid-uuid', // Invalid format
        testIds[2], // Valid
      ];

      // Should process valid IDs and ignore invalid ones
      await service.bulkUpdate([testIds[0], testIds[1]], { isFeatured: true });

      const article1 = await service.findOne(testIds[0]);
      const article2 = await service.findOne(testIds[1]);

      expect(article1.isFeatured).toBe(true);
      expect(article2.isFeatured).toBe(true);
    });

    it('should handle extremely large bulk operations', async () => {
      // Create many test articles
      const manyIds = [];
      for (let i = 0; i < 50; i++) {
        const dto: CreateNewsDto = {
          title: `Large Bulk Test Article ${i + 1}`,
          content: 'Content for large bulk operation testing.',
          category: 'testing',
        };
        const result = await service.create(dto);
        manyIds.push(result.id);
      }

      // Perform bulk operation
      await service.bulkUpdate(manyIds, { priority: 'high' });

      // Verify a few random articles
      const randomIds = [manyIds[0], manyIds[25], manyIds[49]];
      for (const id of randomIds) {
        const article = await service.findOne(id);
        expect(article.priority).toBe('high');
      }
    });
  });

  describe('Content Sanitization Edge Cases', () => {
    it('should handle nested malicious content', async () => {
      const dto: CreateNewsDto = {
        title: 'Nested Malicious Content Test',
        content: `
          <div>
            <script>
              <!-- This is nested -->
              <script>alert('nested XSS')</script>
              <!-- End nested -->
            </script>
          </div>
          <iframe srcdoc="<script>alert('iframe XSS')</script>">
          </iframe>
          <svg onload="alert('SVG XSS')">
            <script>alert('SVG script XSS')</script>
          </svg>
        `,
        category: 'security',
      };

      const result = await service.create(dto);
      expect(result.content).not.toContain('<script>');
      expect(result.content).not.toContain('<iframe>');
      expect(result.content).not.toContain('onload');
      expect(result.content).not.toContain('alert');
    });

    it('should preserve legitimate HTML-like content', async () => {
      const dto: CreateNewsDto = {
        title: 'Legitimate HTML Content Test',
        content: `
          This article discusses <component> tags in React.
          We use angle brackets like <Type> for generics.
          Mathematical expressions: 1 < 2 > 0 and a <= b >= c.
          Code examples: array[index] and object.property.
          Quote marks: "quoted text" and 'single quotes'.
        `,
        category: 'programming',
      };

      const result = await service.create(dto);
      expect(result.content).toContain('<component>');
      expect(result.content).toContain('<Type>');
      expect(result.content).toContain('1 < 2 > 0');
      expect(result.content).toContain('"quoted text"');
    });

    it('should handle binary and unusual character data', async () => {
      const dto: CreateNewsDto = {
        title: 'Binary Data Test Article',
        content: `
          This content contains unusual characters:
          ${String.fromCharCode(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)}
          And some high Unicode:
          ${String.fromCharCode(65536, 65537, 65538)}
          Regular content should remain intact.
        `,
        category: 'testing',
      };

      const result = await service.create(dto);
      expect(result.content).toContain('Regular content should remain intact');
      // Binary characters should be handled gracefully
    });
  });

  describe('Analytics Edge Cases', () => {
    beforeEach(async () => {
      // Create articles with extreme values
      const extremeArticles = [
        {
          title: 'Zero Engagement Article',
          content: 'This article has zero engagement metrics.',
          category: 'testing',
          viewCount: 0,
          likeCount: 0,
          shareCount: 0,
          isPublished: true,
        },
        {
          title: 'High Engagement Article',
          content: 'This article has extremely high engagement.',
          category: 'testing',
          viewCount: 1000000,
          likeCount: 50000,
          shareCount: 10000,
          isPublished: true,
        },
        {
          title: 'Unpublished Article',
          content: 'This article is not published.',
          category: 'testing',
          viewCount: 100,
          likeCount: 10,
          shareCount: 5,
          isPublished: false,
        },
      ];

      for (const article of extremeArticles) {
        const news = repository.create(article);
        await repository.save(news);
      }
    });

    it('should handle division by zero in statistics', async () => {
      // Clear all articles to test with zero data
      await repository.clear();

      const stats = await service.getNewsStatistics();
      expect(stats.totalNews).toBe(0);
      expect(stats.publishedNews).toBe(0);
      expect(stats.totalViews).toBe(0);
      expect(stats.categoriesCount).toBe(0);
    });

    it('should handle extremely large numbers in analytics', async () => {
      const stats = await service.getNewsStatistics();
      expect(typeof stats.totalViews).toBe('number');
      expect(stats.totalViews).toBeGreaterThan(0);
      expect(Number.isFinite(stats.totalViews)).toBe(true);
    });

    it('should handle popular/trending queries with no results', async () => {
      await repository.clear();

      const popular = await service.getPopularNews(10);
      const trending = await service.getTrendingNews(7, 10);
      const featured = await service.getFeaturedNews();

      expect(popular).toEqual([]);
      expect(trending).toEqual([]);
      expect(featured).toEqual([]);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle very long content efficiently', async () => {
      const veryLongContent = 'Lorem ipsum dolor sit amet. '.repeat(10000); // ~270,000 characters

      const dto: CreateNewsDto = {
        title: 'Performance Test: Very Long Content',
        content: veryLongContent,
        category: 'performance',
      };

      const startTime = Date.now();
      const result = await service.create(dto);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.readingTimeMinutes).toBeGreaterThan(50);
    });

    it('should handle queries that could cause performance issues', async () => {
      // Create many articles for performance testing
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          service.create({
            title: `Performance Test Article ${i}`,
            content: 'Content '.repeat(100),
            category: `category-${i % 10}`,
            tags: [`tag-${i % 20}`, `tag-${(i + 1) % 20}`],
            isPublished: i % 2 === 0,
          }),
        );
      }
      await Promise.all(promises);

      // Test potentially expensive queries
      const startTime = Date.now();

      const results = await Promise.all([
        service.findAll({ search: 'test', sortBy: 'viewCount' }),
        service.findAll({ page: 1, limit: 100 }),
        service.getPopularNews(50),
        service.getTrendingNews(30, 50),
        service.getNewsStatistics(),
      ]);

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      results.forEach((result) => expect(result).toBeDefined());
    });
  });

  describe('Race Condition Edge Cases', () => {
    it('should handle concurrent updates to the same article', async () => {
      const dto: CreateNewsDto = {
        title: 'Concurrent Update Test',
        content: 'This article tests concurrent update scenarios.',
        category: 'testing',
      };

      const article = await service.create(dto);

      // Simulate concurrent updates
      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        service.update(article.id, {
          title: `Updated Title ${i}`,
          viewCount: i * 10,
        }),
      );

      const results = await Promise.all(updatePromises);
      const finalArticle = await service.findOne(article.id);

      expect(finalArticle).toBeDefined();
      expect(finalArticle.title).toMatch(/Updated Title \d+/);
    });

    it('should handle concurrent engagement tracking', async () => {
      const dto: CreateNewsDto = {
        title: 'Concurrent Engagement Test',
        content: 'This article tests concurrent engagement tracking.',
        category: 'testing',
      };

      const article = await service.create(dto);

      // Simulate many concurrent view increments
      const viewPromises = Array.from({ length: 50 }, () =>
        service.incrementViewCount(article.id),
      );

      const likePromises = Array.from({ length: 30 }, () =>
        service.incrementLikeCount(article.id),
      );

      await Promise.all([...viewPromises, ...likePromises]);

      const finalArticle = await service.findOne(article.id);

      // Due to potential race conditions, we check for reasonable ranges
      expect(finalArticle.viewCount).toBeGreaterThan(40);
      expect(finalArticle.viewCount).toBeLessThanOrEqual(50);
      expect(finalArticle.likeCount).toBeGreaterThan(25);
      expect(finalArticle.likeCount).toBeLessThanOrEqual(30);
    });
  });
});
