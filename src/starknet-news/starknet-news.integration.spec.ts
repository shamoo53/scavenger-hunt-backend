import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { StarknetNewsModule } from './starknet-news.module';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNewsController } from './starknet-news.controller';
import { StarknetNews } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { BulkNewsActionDto } from './dto/news-analytics.dto';

describe('StarknetNews Integration Tests', () => {
  let module: TestingModule;
  let service: StarknetNewsService;
  let controller: StarknetNewsController;
  let repository: Repository<StarknetNews>;

  // Test data
  const testNewsArticles: Partial<StarknetNews>[] = [
    {
      title: 'StarkNet Mainnet Launch: Revolutionary L2 Scaling',
      content:
        'StarkNet has officially launched its mainnet, bringing unprecedented scaling capabilities to Ethereum. This comprehensive launch includes advanced features, developer tools, and a robust ecosystem that promises to transform how we interact with decentralized applications.',
      summary:
        'StarkNet mainnet brings revolutionary scaling to Ethereum ecosystem',
      excerpt: 'Major milestone achieved in Layer 2 scaling technology',
      category: 'technology',
      tags: ['starknet', 'ethereum', 'layer2', 'scaling', 'mainnet'],
      priority: 'urgent',
      isPublished: true,
      isFeatured: true,
      allowComments: true,
      author: 'StarkWare Team',
      metaTitle: 'StarkNet Mainnet: Revolutionary Ethereum Scaling Solution',
      metaDescription:
        'Discover how StarkNet mainnet launch transforms Ethereum scaling with advanced L2 technology',
      metaKeywords: ['starknet', 'ethereum', 'scaling', 'blockchain', 'layer2'],
      slug: 'starknet-mainnet-launch-revolutionary-scaling',
      readingTimeMinutes: 8,
      viewCount: 2500,
      likeCount: 450,
      shareCount: 125,
    },
    {
      title: 'DeFi Evolution: New Protocols on StarkNet',
      content:
        'The decentralized finance landscape is rapidly evolving with the introduction of innovative protocols on StarkNet. These new applications leverage the power of Layer 2 scaling to provide users with faster transactions, lower fees, and enhanced functionality for complex financial operations.',
      summary: 'Revolutionary DeFi protocols launching on StarkNet platform',
      excerpt: 'Next-generation DeFi applications with enhanced capabilities',
      category: 'defi',
      tags: ['defi', 'starknet', 'protocols', 'ethereum', 'finance'],
      priority: 'high',
      isPublished: true,
      isFeatured: false,
      allowComments: true,
      author: 'DeFi Research Team',
      metaTitle: 'DeFi Evolution: Revolutionary Protocols on StarkNet',
      metaDescription:
        'Explore the next generation of DeFi protocols built on StarkNet scaling technology',
      metaKeywords: ['defi', 'starknet', 'protocols', 'ethereum', 'finance'],
      slug: 'defi-evolution-starknet-protocols',
      readingTimeMinutes: 6,
      viewCount: 1800,
      likeCount: 320,
      shareCount: 89,
    },
    {
      title: 'NFT Marketplace Innovation: Digital Art Meets Scaling',
      content:
        'The NFT space continues to innovate with new marketplace solutions that leverage advanced scaling technology. These platforms offer creators and collectors enhanced functionality, lower transaction costs, and improved user experiences for trading digital assets.',
      summary: 'Innovative NFT marketplaces with advanced scaling features',
      excerpt: 'Revolutionary NFT platforms with enhanced user experience',
      category: 'nft',
      tags: ['nft', 'marketplace', 'digital-art', 'scaling', 'ethereum'],
      priority: 'normal',
      isPublished: true,
      isFeatured: false,
      allowComments: true,
      author: 'NFT Innovation Lab',
      metaTitle:
        'NFT Innovation: Advanced Marketplaces with Scaling Technology',
      metaDescription:
        'Discover innovative NFT marketplaces leveraging scaling technology for better user experience',
      metaKeywords: ['nft', 'marketplace', 'scaling', 'digital-art'],
      slug: 'nft-marketplace-innovation-scaling',
      readingTimeMinutes: 5,
      viewCount: 950,
      likeCount: 180,
      shareCount: 45,
    },
    {
      title: 'Developer Tools: Building the Future of Web3',
      content:
        'The Web3 development ecosystem continues to expand with powerful new tools and frameworks. These innovations enable developers to build more sophisticated applications with better performance, security, and user experience across the entire blockchain ecosystem.',
      summary: 'Advanced developer tools for Web3 application development',
      excerpt: 'Cutting-edge tools empowering Web3 developers worldwide',
      category: 'developer-tools',
      tags: ['web3', 'development', 'tools', 'blockchain', 'ethereum'],
      priority: 'normal',
      isPublished: false, // Draft article
      isFeatured: false,
      allowComments: true,
      author: 'Developer Relations Team',
      metaTitle: 'Web3 Development: Advanced Tools for Blockchain Innovation',
      metaDescription:
        'Explore cutting-edge developer tools shaping the future of Web3 applications',
      metaKeywords: ['web3', 'development', 'tools', 'blockchain'],
      slug: 'web3-developer-tools-future',
      readingTimeMinutes: 7,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
    },
    {
      title: 'Governance Update: Community-Driven Decision Making',
      content:
        'The governance landscape in decentralized protocols continues to evolve with new mechanisms for community participation and decision-making. These updates enable more inclusive and effective governance processes that reflect the diverse needs of ecosystem participants.',
      summary: 'Enhanced governance mechanisms for decentralized communities',
      excerpt: 'Community-driven governance with improved participation',
      category: 'governance',
      tags: ['governance', 'community', 'dao', 'decentralization'],
      priority: 'low',
      isPublished: true,
      isFeatured: false,
      allowComments: true,
      author: 'Governance Committee',
      metaTitle: 'Decentralized Governance: Community-Driven Innovation',
      metaDescription:
        'Learn about enhanced governance mechanisms enabling community-driven decision making',
      metaKeywords: ['governance', 'community', 'dao', 'decentralization'],
      slug: 'governance-community-decision-making',
      readingTimeMinutes: 4,
      viewCount: 650,
      likeCount: 85,
      shareCount: 22,
    },
  ];

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
    controller = module.get<StarknetNewsController>(StarknetNewsController);
    repository = module.get<Repository<StarknetNews>>(
      getRepositoryToken(StarknetNews),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await repository.clear();
  });

  describe('Module Integration', () => {
    it('should initialize all components correctly', () => {
      expect(service).toBeDefined();
      expect(controller).toBeDefined();
      expect(repository).toBeDefined();
    });

    it('should inject dependencies properly', () => {
      expect(service).toBeInstanceOf(StarknetNewsService);
      expect(controller).toBeInstanceOf(StarknetNewsController);
    });
  });

  describe('Complete CRUD Workflow', () => {
    it('should create, read, update, and delete news articles', async () => {
      // Create
      const createDto: CreateNewsDto = {
        title: 'Integration Test: Full CRUD Workflow',
        content:
          'This comprehensive test article validates the complete CRUD workflow including creation, reading, updating, and deletion operations with full validation and error handling.',
        summary: 'Complete CRUD workflow test with comprehensive validation',
        category: 'testing',
        tags: ['integration', 'crud', 'testing', 'validation'],
        priority: 'normal',
        isPublished: true,
        author: 'Integration Test Suite',
      };

      const createdNews = await service.create(createDto);
      expect(createdNews).toBeDefined();
      expect(createdNews.id).toBeDefined();
      expect(createdNews.title).toBe(createDto.title);
      expect(createdNews.slug).toBe('integration-test-full-crud-workflow');
      expect(createdNews.readingTimeMinutes).toBeGreaterThan(0);

      // Read
      const foundNews = await service.findOne(createdNews.id);
      expect(foundNews).toBeDefined();
      expect(foundNews.title).toBe(createDto.title);

      // Update
      const updateDto: UpdateNewsDto = {
        title: 'Updated: Integration Test CRUD Workflow',
        isFeatured: true,
        priority: 'high',
      };

      const updatedNews = await service.update(createdNews.id, updateDto);
      expect(updatedNews.title).toBe(updateDto.title);
      expect(updatedNews.isFeatured).toBe(true);
      expect(updatedNews.priority).toBe('high');

      // Soft Delete
      await service.softRemove(createdNews.id);

      // Verify soft deletion
      const deletedResults = await service.findAll({ includeDeleted: true });
      const deletedNews = deletedResults.data.find(
        (news) => news.id === createdNews.id,
      );
      expect(deletedNews?.deletedAt).toBeDefined();

      // Restore
      const restoredNews = await service.restore(createdNews.id);
      expect(restoredNews.deletedAt).toBeNull();

      // Hard Delete
      await service.remove(createdNews.id);

      // Verify hard deletion
      await expect(service.findOne(createdNews.id)).rejects.toThrow();
    });
  });

  describe('Complex Query Scenarios', () => {
    beforeEach(async () => {
      // Seed test data
      for (const newsData of testNewsArticles) {
        const news = repository.create(newsData);
        await repository.save(news);
      }
    });

    it('should handle complex filtering and pagination', async () => {
      const queryDto: QueryNewsDto = {
        category: 'technology',
        isPublished: true,
        tags: ['starknet', 'ethereum'],
        priority: 'urgent',
        minViews: 1000,
        sortBy: 'viewCount',
        sortOrder: 'DESC',
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto);

      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.data.every((news) => news.category === 'technology')).toBe(
        true,
      );
      expect(result.data.every((news) => news.isPublished)).toBe(true);
      expect(result.data.every((news) => news.viewCount >= 1000)).toBe(true);

      // Verify sorting
      if (result.data.length > 1) {
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i - 1].viewCount).toBeGreaterThanOrEqual(
            result.data[i].viewCount,
          );
        }
      }
    });

    it('should perform full-text search across multiple fields', async () => {
      const searchQueries = [
        'StarkNet mainnet',
        'DeFi protocols',
        'revolutionary scaling',
        'ethereum layer',
      ];

      for (const searchTerm of searchQueries) {
        const result = await service.findAll({ search: searchTerm });

        expect(result.data).toBeDefined();
        if (result.total > 0) {
          const hasSearchTerm = result.data.some(
            (news) =>
              news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              news.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
              news.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              news.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              news.tags?.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase()),
              ),
          );
          expect(hasSearchTerm).toBe(true);
        }
      }
    });

    it('should handle date range filtering', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await service.findAll({
        publishedAfter: yesterday,
        publishedBefore: tomorrow,
        isPublished: true,
      });

      expect(result.data).toBeDefined();
      result.data.forEach((news) => {
        if (news.publishedAt) {
          expect(news.publishedAt).toBeInstanceOf(Date);
          expect(news.publishedAt.getTime()).toBeGreaterThanOrEqual(
            yesterday.getTime(),
          );
          expect(news.publishedAt.getTime()).toBeLessThanOrEqual(
            tomorrow.getTime(),
          );
        }
      });
    });
  });

  describe('Engagement Tracking Integration', () => {
    let testNewsId: string;

    beforeEach(async () => {
      const news = repository.create(testNewsArticles[0]);
      const saved = await repository.save(news);
      testNewsId = saved.id;
    });

    it('should track view counts accurately', async () => {
      const initialNews = await service.findOne(testNewsId);
      const initialViews = initialNews.viewCount;

      // Increment views multiple times
      await service.incrementViewCount(testNewsId);
      await service.incrementViewCount(testNewsId);
      await service.incrementViewCount(testNewsId);

      const updatedNews = await service.findOne(testNewsId);
      expect(updatedNews.viewCount).toBe(initialViews + 3);
    });

    it('should track likes and unlikes correctly', async () => {
      const initialNews = await service.findOne(testNewsId);
      const initialLikes = initialNews.likeCount;

      // Add likes
      await service.incrementLikeCount(testNewsId);
      await service.incrementLikeCount(testNewsId);

      let updatedNews = await service.findOne(testNewsId);
      expect(updatedNews.likeCount).toBe(initialLikes + 2);

      // Remove a like
      await service.decrementLikeCount(testNewsId);

      updatedNews = await service.findOne(testNewsId);
      expect(updatedNews.likeCount).toBe(initialLikes + 1);
    });

    it('should track share counts', async () => {
      const initialNews = await service.findOne(testNewsId);
      const initialShares = initialNews.shareCount;

      await service.incrementShareCount(testNewsId);
      await service.incrementShareCount(testNewsId);

      const updatedNews = await service.findOne(testNewsId);
      expect(updatedNews.shareCount).toBe(initialShares + 2);
    });

    it('should auto-increment views when accessing article via controller', async () => {
      const initialNews = await service.findOne(testNewsId);
      const initialViews = initialNews.viewCount;

      // Access via controller (should auto-increment view)
      const result = await controller.findOne(testNewsId);

      expect(result.id).toBe(testNewsId);

      // Verify view count increased
      const updatedNews = await service.findOne(testNewsId);
      expect(updatedNews.viewCount).toBe(initialViews + 1);
    });
  });

  describe('Analytics and Statistics Integration', () => {
    beforeEach(async () => {
      // Seed comprehensive test data
      for (const newsData of testNewsArticles) {
        const news = repository.create(newsData);
        await repository.save(news);
      }
    });

    it('should calculate comprehensive statistics', async () => {
      const stats = await service.getNewsStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalNews).toBe(testNewsArticles.length);
      expect(stats.publishedNews).toBe(
        testNewsArticles.filter((n) => n.isPublished).length,
      );
      expect(stats.draftNews).toBe(
        testNewsArticles.filter((n) => !n.isPublished).length,
      );
      expect(stats.categoriesCount).toBeGreaterThan(0);
      expect(stats.totalViews).toBeGreaterThan(0);
      expect(stats.totalLikes).toBeGreaterThan(0);
      expect(stats.totalShares).toBeGreaterThan(0);
    });

    it('should return popular articles correctly', async () => {
      const popularNews = await service.getPopularNews(3);

      expect(popularNews).toBeDefined();
      expect(popularNews.length).toBeLessThanOrEqual(3);

      // Verify sorting by engagement
      if (popularNews.length > 1) {
        for (let i = 1; i < popularNews.length; i++) {
          const prev = popularNews[i - 1];
          const curr = popularNews[i];
          expect(prev.viewCount).toBeGreaterThanOrEqual(curr.viewCount);
        }
      }
    });

    it('should return trending articles within time range', async () => {
      const trendingNews = await service.getTrendingNews(30, 5);

      expect(trendingNews).toBeDefined();
      expect(trendingNews.length).toBeLessThanOrEqual(5);

      // All articles should be published and within time range
      trendingNews.forEach((news) => {
        expect(news.isPublished).toBe(true);
        expect(news.publishedAt).toBeDefined();
      });
    });

    it('should return featured articles', async () => {
      const featuredNews = await service.getFeaturedNews();

      expect(featuredNews).toBeDefined();
      featuredNews.forEach((news) => {
        expect(news.isFeatured).toBe(true);
        expect(news.isPublished).toBe(true);
      });
    });

    it('should return articles by tags', async () => {
      const tags = ['starknet', 'ethereum'];
      const taggedNews = await service.getNewsByTags(tags, 10);

      expect(taggedNews).toBeDefined();
      taggedNews.forEach((news) => {
        const hasMatchingTag = tags.some((tag) => news.tags?.includes(tag));
        expect(hasMatchingTag).toBe(true);
      });
    });

    it('should return all available categories and tags', async () => {
      const categories = await service.getCategories();
      const tags = await service.getAllTags();

      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('technology');
      expect(categories).toContain('defi');

      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('starknet');
      expect(tags).toContain('ethereum');
    });
  });

  describe('Bulk Operations Integration', () => {
    let testIds: string[];

    beforeEach(async () => {
      testIds = [];
      for (const newsData of testNewsArticles.slice(0, 3)) {
        const news = repository.create(newsData);
        const saved = await repository.save(news);
        testIds.push(saved.id);
      }
    });

    it('should perform bulk publish operations', async () => {
      await service.bulkUpdate(testIds, {
        isPublished: false,
        publishedAt: null,
      });

      // Verify all are unpublished
      for (const id of testIds) {
        const news = await service.findOne(id);
        expect(news.isPublished).toBe(false);
        expect(news.publishedAt).toBeNull();
      }

      // Bulk publish
      await service.bulkUpdate(testIds, {
        isPublished: true,
        publishedAt: new Date(),
      });

      // Verify all are published
      for (const id of testIds) {
        const news = await service.findOne(id);
        expect(news.isPublished).toBe(true);
        expect(news.publishedAt).toBeDefined();
      }
    });

    it('should perform bulk feature operations', async () => {
      await service.bulkUpdate(testIds, { isFeatured: true });

      for (const id of testIds) {
        const news = await service.findOne(id);
        expect(news.isFeatured).toBe(true);
      }

      await service.bulkUpdate(testIds, { isFeatured: false });

      for (const id of testIds) {
        const news = await service.findOne(id);
        expect(news.isFeatured).toBe(false);
      }
    });

    it('should perform bulk delete operations', async () => {
      await service.bulkDelete(testIds);

      // Verify all are soft deleted
      const results = await service.findAll({ includeDeleted: true });
      const deletedNews = results.data.filter(
        (news) => testIds.includes(news.id) && news.deletedAt !== null,
      );
      expect(deletedNews.length).toBe(testIds.length);
    });

    it('should handle bulk operations via controller', async () => {
      const bulkActionDto: BulkNewsActionDto = {
        ids: testIds,
        action: 'feature',
      };

      await controller.bulkAction(bulkActionDto);

      for (const id of testIds) {
        const news = await service.findOne(id);
        expect(news.isFeatured).toBe(true);
      }
    });
  });

  describe('Content Validation Integration', () => {
    it('should validate and sanitize content on creation', async () => {
      const maliciousDto: CreateNewsDto = {
        title:
          'Test Article with <script>alert("XSS")</script>Malicious Content',
        content:
          'This content contains <script>alert("hack")</script> malicious scripts and <iframe src="evil.com"></iframe> iframes that should be sanitized.',
        summary: 'Clean summary without malicious content',
        category: 'testing',
      };

      const createdNews = await service.create(maliciousDto);

      expect(createdNews.title).not.toContain('<script>');
      expect(createdNews.content).not.toContain('<script>');
      expect(createdNews.content).not.toContain('<iframe>');
      expect(createdNews.slug).toBe('test-article-with-malicious-content');
    });

    it('should reject invalid content', async () => {
      const invalidDto: CreateNewsDto = {
        title: 'Short', // Too short
        content: 'Brief', // Too short
        category: 'test',
        tags: new Array(15).fill('tag'), // Too many tags
        slug: 'Invalid Slug!', // Invalid characters
      };

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should generate unique slugs automatically', async () => {
      const baseDto: CreateNewsDto = {
        title: 'Duplicate Title for Slug Generation Test',
        content:
          'This is a comprehensive test article to validate the automatic slug generation functionality with duplicate titles.',
        category: 'testing',
      };

      const first = await service.create(baseDto);
      const second = await service.create(baseDto);
      const third = await service.create(baseDto);

      expect(first.slug).toBe('duplicate-title-for-slug-generation-test');
      expect(second.slug).toBe('duplicate-title-for-slug-generation-test-1');
      expect(third.slug).toBe('duplicate-title-for-slug-generation-test-2');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle not found errors gracefully', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(service.findOne(nonExistentId)).rejects.toThrow();
      await expect(service.update(nonExistentId, {})).rejects.toThrow();
      await expect(service.restore(nonExistentId)).rejects.toThrow();
    });

    it('should handle validation errors properly', async () => {
      const invalidDto = {
        title: '', // Empty title
        content: '', // Empty content
      } as CreateNewsDto;

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should handle database constraint violations', async () => {
      const dto: CreateNewsDto = {
        title: 'Test Article for Constraint Validation',
        content:
          'This article tests database constraint handling and proper error responses.',
        category: 'testing',
        slug: 'test-slug',
      };

      await service.create(dto);

      // Try to create another with the same slug
      await expect(service.create(dto)).rejects.toThrow();
    });
  });
});
