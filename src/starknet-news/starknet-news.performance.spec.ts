import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StarknetNewsModule } from './starknet-news.module';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNews } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

describe('StarkNet News Performance & Load Tests', () => {
  let module: TestingModule;
  let service: StarknetNewsService;
  let repository: Repository<StarknetNews>;

  // Test configuration
  const PERFORMANCE_TIMEOUT = 30000; // 30 seconds timeout for performance tests
  const LARGE_DATASET_SIZE = 1000;
  const CONCURRENT_OPERATIONS = 100;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [StarknetNews],
          synchronize: true,
          dropSchema: true,
          logging: false, // Disable logging for performance tests
        }),
        ScheduleModule.forRoot(),
        StarknetNewsModule,
      ],
    }).compile();

    service = module.get<StarknetNewsService>(StarknetNewsService);
    repository = module.get<Repository<StarknetNews>>(
      getRepositoryToken(StarknetNews),
    );
  }, PERFORMANCE_TIMEOUT);

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('Large Dataset Performance Tests', () => {
    it(
      'should efficiently create large numbers of articles',
      async () => {
        const startTime = Date.now();
        const batchSize = 100;
        const totalArticles = LARGE_DATASET_SIZE;

        // Create articles in batches for better memory management
        for (let batch = 0; batch < totalArticles / batchSize; batch++) {
          const promises = [];

          for (let i = 0; i < batchSize; i++) {
            const articleNumber = batch * batchSize + i + 1;
            const dto: CreateNewsDto = {
              title: `Performance Test Article ${articleNumber}: StarkNet Innovation`,
              content:
                `This is a comprehensive performance test article number ${articleNumber}. `.repeat(
                  50,
                ), // ~3KB content
              summary: `Performance test summary for article ${articleNumber}`,
              excerpt: `Test excerpt ${articleNumber}`,
              category: `category-${articleNumber % 10}`,
              tags: [
                `tag-${articleNumber % 20}`,
                `tag-${(articleNumber + 1) % 20}`,
                `performance`,
              ],
              priority: ['low', 'normal', 'high', 'urgent'][
                articleNumber % 4
              ] as any,
              isPublished: articleNumber % 3 !== 0, // 2/3 published
              isFeatured: articleNumber % 10 === 0, // 1/10 featured
              author: `Author ${articleNumber % 5}`,
              viewCount: Math.floor(Math.random() * 10000),
              likeCount: Math.floor(Math.random() * 1000),
              shareCount: Math.floor(Math.random() * 100),
            };

            promises.push(service.create(dto));
          }

          await Promise.all(promises);

          // Log progress every 200 articles
          if (((batch + 1) * batchSize) % 200 === 0) {
            console.log(`Created ${(batch + 1) * batchSize} articles...`);
          }
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        const articlesPerSecond = (totalArticles / duration) * 1000;

        console.log(`Created ${totalArticles} articles in ${duration}ms`);
        console.log(
          `Performance: ${articlesPerSecond.toFixed(2)} articles/second`,
        );

        expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
        expect(articlesPerSecond).toBeGreaterThan(10); // Should create at least 10 articles/second

        // Verify all articles were created
        const count = await repository.count();
        expect(count).toBe(totalArticles);
      },
      PERFORMANCE_TIMEOUT * 2,
    );

    it(
      'should efficiently query large datasets with pagination',
      async () => {
        // First create test data
        await createLargeTestDataset(service, 500);

        const testQueries: QueryNewsDto[] = [
          { page: 1, limit: 100 },
          { page: 5, limit: 50 },
          { page: 10, limit: 25 },
          { category: 'category-1', page: 1, limit: 50 },
          {
            isPublished: true,
            sortBy: 'viewCount',
            sortOrder: 'DESC',
            page: 1,
            limit: 50,
          },
          { search: 'performance test', page: 1, limit: 25 },
          { tags: ['performance', 'tag-1'], page: 1, limit: 30 },
          { minViews: 5000, sortBy: 'likeCount', page: 1, limit: 40 },
        ];

        const startTime = Date.now();
        const results = [];

        for (const query of testQueries) {
          const queryStart = Date.now();
          const result = await service.findAll(query);
          const queryDuration = Date.now() - queryStart;

          results.push({
            query,
            result,
            duration: queryDuration,
          });

          // Each query should complete within 2 seconds
          expect(queryDuration).toBeLessThan(2000);
          expect(result.data.length).toBeLessThanOrEqual(query.limit || 10);
        }

        const totalDuration = Date.now() - startTime;
        const averageQueryTime = totalDuration / testQueries.length;

        console.log(
          `Executed ${testQueries.length} complex queries in ${totalDuration}ms`,
        );
        console.log(`Average query time: ${averageQueryTime.toFixed(2)}ms`);

        expect(averageQueryTime).toBeLessThan(1000); // Average should be under 1 second
      },
      PERFORMANCE_TIMEOUT,
    );

    it(
      'should handle full-text search efficiently on large datasets',
      async () => {
        await createLargeTestDataset(service, 1000);

        const searchTerms = [
          'StarkNet',
          'performance test',
          'innovation technology',
          'blockchain scaling',
          'comprehensive article',
          'category-5',
          'Author 2',
        ];

        const startTime = Date.now();
        const searchResults = [];

        for (const searchTerm of searchTerms) {
          const searchStart = Date.now();
          const result = await service.findAll({
            search: searchTerm,
            page: 1,
            limit: 50,
          });
          const searchDuration = Date.now() - searchStart;

          searchResults.push({
            searchTerm,
            resultCount: result.total,
            duration: searchDuration,
          });

          // Search should complete quickly even on large datasets
          expect(searchDuration).toBeLessThan(3000);
        }

        const totalSearchDuration = Date.now() - startTime;
        const averageSearchTime = totalSearchDuration / searchTerms.length;

        console.log(
          `Executed ${searchTerms.length} searches in ${totalSearchDuration}ms`,
        );
        console.log(`Average search time: ${averageSearchTime.toFixed(2)}ms`);

        expect(averageSearchTime).toBeLessThan(1500);
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Concurrent Operations Performance', () => {
    it(
      'should handle concurrent read operations efficiently',
      async () => {
        // Create initial dataset
        await createTestDataset(service, 100);

        const startTime = Date.now();
        const concurrentReads = [];

        // Simulate concurrent users reading different articles
        for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
          const promise = service.findAll({
            page: Math.floor(Math.random() * 5) + 1,
            limit: Math.floor(Math.random() * 20) + 10,
            category: `category-${Math.floor(Math.random() * 10)}`,
            sortBy: ['viewCount', 'likeCount', 'publishedAt'][
              Math.floor(Math.random() * 3)
            ],
          });
          concurrentReads.push(promise);
        }

        const results = await Promise.all(concurrentReads);
        const duration = Date.now() - startTime;
        const operationsPerSecond = (CONCURRENT_OPERATIONS / duration) * 1000;

        console.log(
          `Completed ${CONCURRENT_OPERATIONS} concurrent reads in ${duration}ms`,
        );
        console.log(
          `Read performance: ${operationsPerSecond.toFixed(2)} operations/second`,
        );

        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(operationsPerSecond).toBeGreaterThan(10);
        expect(results.every((result) => result !== undefined)).toBe(true);
      },
      PERFORMANCE_TIMEOUT,
    );

    it(
      'should handle concurrent write operations efficiently',
      async () => {
        const startTime = Date.now();
        const concurrentWrites = [];

        // Simulate concurrent article creation
        for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
          const dto: CreateNewsDto = {
            title: `Concurrent Test Article ${i}: Performance Validation`,
            content:
              `This is concurrent test article ${i} for performance validation. `.repeat(
                30,
              ),
            category: `concurrent-category-${i % 5}`,
            tags: [`concurrent-${i % 10}`, `performance`, `test-${i}`],
            priority: ['low', 'normal', 'high'][i % 3] as any,
            isPublished: i % 2 === 0,
            author: `Concurrent Author ${i % 3}`,
          };

          concurrentWrites.push(service.create(dto));
        }

        const results = await Promise.all(concurrentWrites);
        const duration = Date.now() - startTime;
        const operationsPerSecond = (CONCURRENT_OPERATIONS / duration) * 1000;

        console.log(
          `Completed ${CONCURRENT_OPERATIONS} concurrent writes in ${duration}ms`,
        );
        console.log(
          `Write performance: ${operationsPerSecond.toFixed(2)} operations/second`,
        );

        expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
        expect(operationsPerSecond).toBeGreaterThan(5);
        expect(results.every((result) => result && result.id)).toBe(true);

        // Verify all articles were created with unique IDs
        const ids = results.map((r) => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      },
      PERFORMANCE_TIMEOUT,
    );

    it(
      'should handle concurrent engagement tracking efficiently',
      async () => {
        // Create test articles
        const articles = [];
        for (let i = 0; i < 20; i++) {
          const article = await service.create({
            title: `Engagement Test Article ${i}`,
            content: 'Content for engagement testing.',
            category: 'engagement',
          });
          articles.push(article);
        }

        const startTime = Date.now();
        const engagementOperations = [];

        // Simulate many concurrent engagement actions
        for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
          const randomArticle =
            articles[Math.floor(Math.random() * articles.length)];
          const operationType = Math.floor(Math.random() * 4);

          let operation;
          switch (operationType) {
            case 0:
              operation = service.incrementViewCount(randomArticle.id);
              break;
            case 1:
              operation = service.incrementLikeCount(randomArticle.id);
              break;
            case 2:
              operation = service.incrementShareCount(randomArticle.id);
              break;
            case 3:
              operation = service.decrementLikeCount(randomArticle.id);
              break;
          }

          engagementOperations.push(operation);
        }

        await Promise.all(engagementOperations);
        const duration = Date.now() - startTime;
        const operationsPerSecond = (CONCURRENT_OPERATIONS / duration) * 1000;

        console.log(
          `Completed ${CONCURRENT_OPERATIONS} engagement operations in ${duration}ms`,
        );
        console.log(
          `Engagement performance: ${operationsPerSecond.toFixed(2)} operations/second`,
        );

        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(operationsPerSecond).toBeGreaterThan(10);

        // Verify engagement counts were updated
        const updatedArticles = await Promise.all(
          articles.map((a) => service.findOne(a.id)),
        );
        const totalEngagement = updatedArticles.reduce(
          (sum, article) =>
            sum + article.viewCount + article.likeCount + article.shareCount,
          0,
        );
        expect(totalEngagement).toBeGreaterThan(0);
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Memory Efficiency Tests', () => {
    it(
      'should handle large content articles without memory issues',
      async () => {
        const largeContent =
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(
            5000,
          ); // ~275KB
        const initialMemory = process.memoryUsage();

        const promises = [];
        for (let i = 0; i < 50; i++) {
          const dto: CreateNewsDto = {
            title: `Large Content Article ${i}`,
            content: largeContent,
            category: 'large-content',
            tags: [`large-${i}`, 'memory-test'],
          };
          promises.push(service.create(dto));
        }

        await Promise.all(promises);

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryPerArticle = memoryIncrease / 50;

        console.log(
          `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
        );
        console.log(
          `Memory per large article: ${(memoryPerArticle / 1024).toFixed(2)} KB`,
        );

        // Memory increase should be reasonable (less than 100MB for 50 large articles)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      },
      PERFORMANCE_TIMEOUT,
    );

    it(
      'should efficiently handle batch operations',
      async () => {
        // Create many articles for batch testing
        const articles = [];
        for (let i = 0; i < 200; i++) {
          const article = await service.create({
            title: `Batch Test Article ${i}`,
            content: 'Content for batch operation testing.',
            category: `batch-${i % 5}`,
            isPublished: i % 2 === 0,
          });
          articles.push(article);
        }

        const batchIds = articles.map((a) => a.id);
        const startTime = Date.now();

        // Test bulk operations performance
        await service.bulkUpdate(batchIds.slice(0, 100), { isFeatured: true });
        await service.bulkUpdate(batchIds.slice(100, 200), {
          priority: 'high',
        });
        await service.bulkDelete(batchIds.slice(150, 200));

        const duration = Date.now() - startTime;
        console.log(
          `Bulk operations on 200 articles completed in ${duration}ms`,
        );

        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

        // Verify operations were applied
        const featuredCount = await repository.count({
          where: { isFeatured: true },
        });
        expect(featuredCount).toBe(100);
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Analytics Performance Tests', () => {
    it(
      'should calculate statistics efficiently on large datasets',
      async () => {
        await createLargeTestDataset(service, 1000);

        const iterations = 10;
        const durations = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          const stats = await service.getNewsStatistics();
          const duration = Date.now() - startTime;
          durations.push(duration);

          expect(stats.totalNews).toBe(1000);
          expect(stats.publishedNews).toBeGreaterThan(0);
          expect(stats.totalViews).toBeGreaterThan(0);
          expect(stats.categoriesCount).toBeGreaterThan(0);
        }

        const averageDuration =
          durations.reduce((a, b) => a + b, 0) / iterations;
        const maxDuration = Math.max(...durations);

        console.log(
          `Statistics calculation - Average: ${averageDuration.toFixed(2)}ms, Max: ${maxDuration}ms`,
        );

        expect(averageDuration).toBeLessThan(1000); // Should average under 1 second
        expect(maxDuration).toBeLessThan(2000); // Should never exceed 2 seconds
      },
      PERFORMANCE_TIMEOUT,
    );

    it(
      'should handle popular/trending queries efficiently',
      async () => {
        await createLargeTestDataset(service, 500);

        const startTime = Date.now();
        const analyticsQueries = await Promise.all([
          service.getPopularNews(50),
          service.getTrendingNews(30, 50),
          service.getFeaturedNews(),
          service.getCategories(),
          service.getAllTags(),
        ]);

        const duration = Date.now() - startTime;

        console.log(`Analytics queries completed in ${duration}ms`);

        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        expect(analyticsQueries.every((result) => result !== undefined)).toBe(
          true,
        );
      },
      PERFORMANCE_TIMEOUT,
    );
  });

  describe('Stress Tests', () => {
    it(
      'should handle rapid successive operations without degradation',
      async () => {
        const operationCounts = [];
        const testDuration = 10000; // 10 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < testDuration) {
          const iterationStart = Date.now();
          let operationsThisSecond = 0;

          // Perform various operations rapidly
          const operations = [];
          for (let i = 0; i < 20; i++) {
            operations.push(
              service.create({
                title: `Stress Test Article ${Date.now()}-${i}`,
                content: 'Rapid fire content creation test.',
                category: 'stress-test',
              }),
            );
          }

          await Promise.all(operations);
          operationsThisSecond = operations.length;

          // Also test queries
          await service.findAll({ category: 'stress-test', limit: 10 });
          operationsThisSecond++;

          operationCounts.push(operationsThisSecond);

          // Small delay to prevent overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const totalOperations = operationCounts.reduce((a, b) => a + b, 0);
        const averageOpsPerIteration = totalOperations / operationCounts.length;

        console.log(
          `Stress test: ${totalOperations} operations over ${testDuration}ms`,
        );
        console.log(
          `Average operations per iteration: ${averageOpsPerIteration.toFixed(2)}`,
        );

        expect(averageOpsPerIteration).toBeGreaterThan(10);

        // Performance should not degrade significantly over time
        const firstHalf = operationCounts.slice(
          0,
          Math.floor(operationCounts.length / 2),
        );
        const secondHalf = operationCounts.slice(
          Math.floor(operationCounts.length / 2),
        );
        const firstHalfAvg =
          firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        // Second half should not be significantly slower than first half
        expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg * 0.7);
      },
      PERFORMANCE_TIMEOUT * 2,
    );
  });

  // Helper functions
  async function createTestDataset(
    service: StarknetNewsService,
    count: number,
  ): Promise<void> {
    const promises = [];

    for (let i = 0; i < count; i++) {
      const dto: CreateNewsDto = {
        title: `Test Article ${i}: Performance Dataset`,
        content: `Content for test article ${i}. `.repeat(20),
        category: `category-${i % 10}`,
        tags: [`tag-${i % 20}`, `performance`],
        priority: ['low', 'normal', 'high', 'urgent'][i % 4] as any,
        isPublished: i % 3 !== 0,
        author: `Author ${i % 5}`,
        viewCount: Math.floor(Math.random() * 1000),
        likeCount: Math.floor(Math.random() * 100),
      };

      promises.push(service.create(dto));
    }

    await Promise.all(promises);
  }

  async function createLargeTestDataset(
    service: StarknetNewsService,
    count: number,
  ): Promise<void> {
    const batchSize = 50;

    for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
      const promises = [];
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, count);

      for (let i = startIdx; i < endIdx; i++) {
        const dto: CreateNewsDto = {
          title: `Large Dataset Article ${i}: Comprehensive Performance Testing`,
          content:
            `This is a comprehensive test article number ${i} for large dataset performance testing. `.repeat(
              40,
            ),
          summary: `Performance test summary for article ${i}`,
          excerpt: `Excerpt for article ${i}`,
          category: `category-${i % 10}`,
          tags: [
            `tag-${i % 20}`,
            `tag-${(i + 1) % 20}`,
            `performance`,
            `large-dataset`,
          ],
          priority: ['low', 'normal', 'high', 'urgent'][i % 4] as any,
          isPublished: i % 3 !== 0,
          isFeatured: i % 20 === 0,
          author: `Author ${i % 5}`,
          viewCount: Math.floor(Math.random() * 10000),
          likeCount: Math.floor(Math.random() * 1000),
          shareCount: Math.floor(Math.random() * 100),
        };

        promises.push(service.create(dto));
      }

      await Promise.all(promises);
    }
  }
});
