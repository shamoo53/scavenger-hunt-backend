import { Test, TestingModule } from '@nestjs/testing';
import { StarknetNewsController } from './starknet-news.controller';
import { StarknetNewsService } from './starknet-news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { BulkNewsActionDto } from './dto/news-analytics.dto';
import { BadRequestException } from '@nestjs/common';

const mockNewsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findPublished: jest.fn(),
  findByCategory: jest.fn(),
  getFeaturedNews: jest.fn(),
  getPopularNews: jest.fn(),
  getTrendingNews: jest.fn(),
  getNewsByTags: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  restore: jest.fn(),
  getCategories: jest.fn(),
  getAllTags: jest.fn(),
  getNewsStatistics: jest.fn(),
  incrementViewCount: jest.fn(),
  incrementLikeCount: jest.fn(),
  decrementLikeCount: jest.fn(),
  incrementShareCount: jest.fn(),
  bulkUpdate: jest.fn(),
  bulkDelete: jest.fn(),
});

describe('StarknetNewsController', () => {
  let controller: StarknetNewsController;
  let service: jest.Mocked<StarknetNewsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StarknetNewsController],
      providers: [
        {
          provide: StarknetNewsService,
          useFactory: mockNewsService,
        },
      ],
    }).compile();

    controller = module.get<StarknetNewsController>(StarknetNewsController);
    service = module.get(StarknetNewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a comprehensive news article', async () => {
      const createNewsDto: CreateNewsDto = {
        title: 'StarkNet Mainnet Launch: Revolutionary Scaling Solution',
        content:
          'StarkNet has officially launched its mainnet, bringing unprecedented scaling capabilities to Ethereum. This groundbreaking development represents a major milestone in Layer 2 technology, offering developers and users enhanced transaction throughput and reduced costs.',
        summary:
          'StarkNet mainnet launch brings revolutionary scaling to Ethereum',
        excerpt: 'Major L2 milestone achieved with enhanced capabilities',
        category: 'technology',
        tags: ['starknet', 'ethereum', 'layer2', 'scaling'],
        priority: 'high',
        isPublished: true,
        isFeatured: true,
        allowComments: true,
        author: 'StarkWare Team',
        metaTitle: 'StarkNet Mainnet Launch - Revolutionary Ethereum Scaling',
        metaDescription:
          'Discover how StarkNet mainnet launch transforms Ethereum scaling',
        metaKeywords: ['starknet', 'ethereum', 'scaling', 'blockchain'],
        slug: 'starknet-mainnet-launch-revolutionary-scaling',
        readingTimeMinutes: 5,
      };

      const mockResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...createNewsDto,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-15T09:45:00Z'),
        updatedAt: new Date('2024-01-15T09:45:00Z'),
      };

      service.create.mockResolvedValue(mockResult as any);

      const result = await controller.create(createNewsDto);

      expect(service.create).toHaveBeenCalledWith(createNewsDto);
      expect(result).toEqual(mockResult);
      expect(result.tags).toContain('starknet');
      expect(result.priority).toBe('high');
    });

    it('should handle validation errors during creation', async () => {
      const invalidDto: CreateNewsDto = {
        title: 'Short', // Too short
        content: 'Brief', // Too short
        category: 'test',
      };

      service.create.mockRejectedValue(
        new BadRequestException([
          'Title must be at least 10 characters long',
          'Content must be at least 100 characters long',
        ]),
      );

      await expect(controller.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated news with comprehensive filtering', async () => {
      const queryDto: QueryNewsDto = {
        page: 2,
        limit: 15,
        category: 'technology',
        isPublished: true,
        isFeatured: false,
        tags: ['starknet', 'ethereum'],
        priority: 'high',
        author: 'StarkWare',
        search: 'mainnet launch',
        publishedAfter: new Date('2024-01-01'),
        publishedBefore: new Date('2024-01-31'),
        minViews: 100,
        minLikes: 10,
        sortBy: 'viewCount',
        sortOrder: 'DESC',
        includeDeleted: false,
      };

      const mockResult = {
        data: [
          {
            id: '1',
            title: 'StarkNet Mainnet Launch',
            content: 'Revolutionary scaling solution...',
            category: 'technology',
            tags: ['starknet', 'ethereum', 'scaling'],
            priority: 'high',
            author: 'StarkWare Team',
            viewCount: 1500,
            likeCount: 250,
            shareCount: 75,
            isPublished: true,
            isFeatured: false,
            publishedAt: new Date('2024-01-15T10:00:00Z'),
          },
          {
            id: '2',
            title: 'Ethereum Scaling Evolution',
            content: 'Layer 2 solutions are transforming...',
            category: 'technology',
            tags: ['ethereum', 'layer2'],
            priority: 'normal',
            author: 'Tech Analyst',
            viewCount: 800,
            likeCount: 120,
            shareCount: 35,
            isPublished: true,
            isFeatured: false,
            publishedAt: new Date('2024-01-14T15:30:00Z'),
          },
        ],
        total: 45,
        page: 2,
        limit: 15,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
      expect(result.data).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(true);
      expect(result.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      const queryDto: QueryNewsDto = {
        search: 'nonexistent-topic',
        page: 1,
        limit: 10,
      };

      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('content discovery endpoints', () => {
    describe('findPublished', () => {
      it('should return all published news articles', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Published News 1',
            isPublished: true,
            publishedAt: new Date('2024-01-15T10:00:00Z'),
          },
          {
            id: '2',
            title: 'Published News 2',
            isPublished: true,
            publishedAt: new Date('2024-01-14T15:00:00Z'),
          },
        ];

        service.findPublished.mockResolvedValue(mockNews as any);

        const result = await controller.findPublished();

        expect(service.findPublished).toHaveBeenCalled();
        expect(result).toEqual(mockNews);
        expect(result).toHaveLength(2);
      });
    });

    describe('getFeaturedNews', () => {
      it('should return featured news articles', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Featured: StarkNet Revolution',
            isFeatured: true,
            priority: 'urgent',
          },
        ];

        service.getFeaturedNews.mockResolvedValue(mockNews as any);

        const result = await controller.getFeaturedNews();

        expect(service.getFeaturedNews).toHaveBeenCalled();
        expect(result).toEqual(mockNews);
        expect(result[0].isFeatured).toBe(true);
      });
    });

    describe('getPopularNews', () => {
      it('should return popular news with custom limit', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Most Popular Article',
            viewCount: 5000,
            likeCount: 800,
            shareCount: 200,
          },
          {
            id: '2',
            title: 'Second Popular Article',
            viewCount: 3000,
            likeCount: 450,
            shareCount: 120,
          },
        ];

        service.getPopularNews.mockResolvedValue(mockNews as any);

        const result = await controller.getPopularNews(5);

        expect(service.getPopularNews).toHaveBeenCalledWith(5);
        expect(result).toEqual(mockNews);
        expect(result[0].viewCount).toBeGreaterThan(result[1].viewCount);
      });

      it('should use default limit when not specified', async () => {
        service.getPopularNews.mockResolvedValue([] as any);

        await controller.getPopularNews(10);

        expect(service.getPopularNews).toHaveBeenCalledWith(10);
      });
    });

    describe('getTrendingNews', () => {
      it('should return trending news with time parameters', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Trending: Latest Update',
            publishedAt: new Date('2024-01-14T10:00:00Z'),
            viewCount: 2000,
            likeCount: 300,
          },
        ];

        service.getTrendingNews.mockResolvedValue(mockNews as any);

        const result = await controller.getTrendingNews(14, 20);

        expect(service.getTrendingNews).toHaveBeenCalledWith(14, 20);
        expect(result).toEqual(mockNews);
      });

      it('should use default parameters', async () => {
        service.getTrendingNews.mockResolvedValue([] as any);

        await controller.getTrendingNews(7, 10);

        expect(service.getTrendingNews).toHaveBeenCalledWith(7, 10);
      });
    });

    describe('findByCategory', () => {
      it('should return news articles by specific category', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'DeFi Innovation',
            category: 'defi',
            tags: ['defi', 'ethereum', 'finance'],
          },
          {
            id: '2',
            title: 'DeFi Protocols Update',
            category: 'defi',
            tags: ['defi', 'protocols'],
          },
        ];

        service.findByCategory.mockResolvedValue(mockNews as any);

        const result = await controller.findByCategory('defi');

        expect(service.findByCategory).toHaveBeenCalledWith('defi');
        expect(result).toEqual(mockNews);
        expect(result.every((news) => news.category === 'defi')).toBe(true);
      });
    });

    describe('getNewsByTags', () => {
      it('should return news articles by multiple tags', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Ethereum Scaling Solutions',
            tags: ['ethereum', 'scaling', 'layer2'],
          },
          {
            id: '2',
            title: 'Layer 2 Innovations',
            tags: ['layer2', 'ethereum', 'starknet'],
          },
        ];

        service.getNewsByTags.mockResolvedValue(mockNews as any);

        const result = await controller.getNewsByTags(
          'ethereum,layer2,starknet',
          25,
        );

        expect(service.getNewsByTags).toHaveBeenCalledWith(
          ['ethereum', 'layer2', 'starknet'],
          25,
        );
        expect(result).toEqual(mockNews);
      });

      it('should handle single tag', async () => {
        const mockNews = [
          { id: '1', title: 'Single Tag News', tags: ['ethereum'] },
        ];

        service.getNewsByTags.mockResolvedValue(mockNews as any);

        const result = await controller.getNewsByTags('ethereum', 20);

        expect(service.getNewsByTags).toHaveBeenCalledWith(['ethereum'], 20);
        expect(result).toEqual(mockNews);
      });

      it('should trim whitespace from tags', async () => {
        service.getNewsByTags.mockResolvedValue([] as any);

        await controller.getNewsByTags(' ethereum , layer2 , starknet ', 15);

        expect(service.getNewsByTags).toHaveBeenCalledWith(
          ['ethereum', 'layer2', 'starknet'],
          15,
        );
      });
    });
  });

  describe('metadata endpoints', () => {
    describe('getCategories', () => {
      it('should return all available categories', async () => {
        const mockCategories = [
          'technology',
          'defi',
          'nft',
          'gaming',
          'governance',
          'developer-tools',
          'partnerships',
          'announcements',
        ];

        service.getCategories.mockResolvedValue(mockCategories);

        const result = await controller.getCategories();

        expect(service.getCategories).toHaveBeenCalled();
        expect(result).toEqual(mockCategories);
        expect(result).toContain('technology');
        expect(result).toContain('defi');
      });
    });

    describe('getAllTags', () => {
      it('should return all available tags', async () => {
        const mockTags = [
          'ethereum',
          'starknet',
          'layer2',
          'scaling',
          'defi',
          'nft',
          'governance',
          'developers',
          'partnerships',
          'mainnet',
          'testnet',
          'cairo',
        ];

        service.getAllTags.mockResolvedValue(mockTags);

        const result = await controller.getAllTags();

        expect(service.getAllTags).toHaveBeenCalled();
        expect(result).toEqual(mockTags);
        expect(result.length).toBeGreaterThan(5);
      });
    });

    describe('getStatistics', () => {
      it('should return comprehensive news statistics', async () => {
        const mockStats = {
          totalNews: 500,
          publishedNews: 400,
          draftNews: 85,
          scheduledNews: 15,
          totalViews: 125000,
          totalLikes: 15000,
          totalShares: 4500,
          categoriesCount: 8,
          tagsCount: 75,
        };

        service.getNewsStatistics.mockResolvedValue(mockStats);

        const result = await controller.getStatistics();

        expect(service.getNewsStatistics).toHaveBeenCalled();
        expect(result).toEqual(mockStats);
        expect(result.totalNews).toBe(500);
        expect(
          result.publishedNews + result.draftNews + result.scheduledNews,
        ).toBe(500);
        expect(result.totalViews).toBeGreaterThan(0);
      });
    });
  });

  describe('individual article operations', () => {
    const testId = '550e8400-e29b-41d4-a716-446655440000';

    describe('findOne', () => {
      it('should return news article and auto-increment view count', async () => {
        const mockNews = {
          id: testId,
          title: 'Comprehensive News Article',
          content: 'Detailed content about StarkNet developments...',
          viewCount: 150,
          likeCount: 25,
          shareCount: 8,
          publishedAt: new Date('2024-01-15T10:00:00Z'),
        };

        service.findOne.mockResolvedValue(mockNews as any);
        service.incrementViewCount.mockResolvedValue(undefined);

        const result = await controller.findOne(testId);

        expect(service.findOne).toHaveBeenCalledWith(testId);
        expect(service.incrementViewCount).toHaveBeenCalledWith(testId);
        expect(result).toEqual(mockNews);
      });
    });

    describe('update', () => {
      it('should update news article with partial data', async () => {
        const updateDto: UpdateNewsDto = {
          title: 'Updated: StarkNet Mainnet Success',
          isFeatured: true,
          priority: 'urgent',
          tags: ['starknet', 'mainnet', 'success', 'ethereum'],
        };

        const mockUpdatedNews = {
          id: testId,
          title: 'Updated: StarkNet Mainnet Success',
          content: 'Original content remains...',
          isFeatured: true,
          priority: 'urgent',
          tags: ['starknet', 'mainnet', 'success', 'ethereum'],
          updatedAt: new Date('2024-01-15T11:30:00Z'),
        };

        service.update.mockResolvedValue(mockUpdatedNews as any);

        const result = await controller.update(testId, updateDto);

        expect(service.update).toHaveBeenCalledWith(testId, updateDto);
        expect(result).toEqual(mockUpdatedNews);
        expect(result.isFeatured).toBe(true);
        expect(result.priority).toBe('urgent');
      });
    });

    describe('remove', () => {
      it('should soft delete news article', async () => {
        service.softRemove.mockResolvedValue(undefined);

        await controller.remove(testId);

        expect(service.softRemove).toHaveBeenCalledWith(testId);
      });
    });
  });

  describe('engagement tracking', () => {
    const testId = '550e8400-e29b-41d4-a716-446655440000';

    describe('incrementView', () => {
      it('should manually increment view count', async () => {
        service.incrementViewCount.mockResolvedValue(undefined);

        await controller.incrementView(testId);

        expect(service.incrementViewCount).toHaveBeenCalledWith(testId);
      });
    });

    describe('incrementLike', () => {
      it('should increment like count', async () => {
        service.incrementLikeCount.mockResolvedValue(undefined);

        await controller.incrementLike(testId);

        expect(service.incrementLikeCount).toHaveBeenCalledWith(testId);
      });
    });

    describe('decrementLike', () => {
      it('should decrement like count (unlike)', async () => {
        service.decrementLikeCount.mockResolvedValue(undefined);

        await controller.decrementLike(testId);

        expect(service.decrementLikeCount).toHaveBeenCalledWith(testId);
      });
    });

    describe('incrementShare', () => {
      it('should increment share count', async () => {
        service.incrementShareCount.mockResolvedValue(undefined);

        await controller.incrementShare(testId);

        expect(service.incrementShareCount).toHaveBeenCalledWith(testId);
      });
    });
  });

  describe('admin operations', () => {
    const testId = '550e8400-e29b-41d4-a716-446655440000';

    describe('restore', () => {
      it('should restore soft-deleted news article', async () => {
        const mockRestoredNews = {
          id: testId,
          title: 'Restored News Article',
          content: 'This article was successfully restored',
          deletedAt: null,
          updatedAt: new Date('2024-01-15T12:00:00Z'),
        };

        service.restore.mockResolvedValue(mockRestoredNews as any);

        const result = await controller.restore(testId);

        expect(service.restore).toHaveBeenCalledWith(testId);
        expect(result).toEqual(mockRestoredNews);
        expect(result.deletedAt).toBeNull();
      });
    });

    describe('hardDelete', () => {
      it('should permanently delete news article', async () => {
        service.remove.mockResolvedValue(undefined);

        await controller.hardDelete(testId);

        expect(service.remove).toHaveBeenCalledWith(testId);
      });
    });

    describe('bulkAction', () => {
      const testIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440005',
      ];

      it('should perform bulk publish action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds,
          action: 'publish',
        };

        service.bulkUpdate.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkUpdate).toHaveBeenCalledWith(testIds, {
          isPublished: true,
          publishedAt: expect.any(Date),
        });
      });

      it('should perform bulk unpublish action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds,
          action: 'unpublish',
        };

        service.bulkUpdate.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkUpdate).toHaveBeenCalledWith(testIds, {
          isPublished: false,
          publishedAt: null,
        });
      });

      it('should perform bulk delete action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds,
          action: 'delete',
        };

        service.bulkDelete.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkDelete).toHaveBeenCalledWith(testIds);
      });

      it('should perform bulk archive action (same as delete)', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds,
          action: 'archive',
        };

        service.bulkDelete.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkDelete).toHaveBeenCalledWith(testIds);
      });

      it('should perform bulk feature action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds.slice(0, 2),
          action: 'feature',
        };

        service.bulkUpdate.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkUpdate).toHaveBeenCalledWith(testIds.slice(0, 2), {
          isFeatured: true,
        });
      });

      it('should perform bulk unfeature action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds.slice(0, 3),
          action: 'unfeature',
        };

        service.bulkUpdate.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkUpdate).toHaveBeenCalledWith(testIds.slice(0, 3), {
          isFeatured: false,
        });
      });

      it('should throw error for unknown bulk action', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: testIds,
          action: 'unknown-action' as any,
        };

        await expect(controller.bulkAction(bulkActionDto)).rejects.toThrow(
          'Unknown action: unknown-action',
        );
        expect(service.bulkUpdate).not.toHaveBeenCalled();
        expect(service.bulkDelete).not.toHaveBeenCalled();
      });

      it('should handle empty ids array', async () => {
        const bulkActionDto: BulkNewsActionDto = {
          ids: [],
          action: 'publish',
        };

        service.bulkUpdate.mockResolvedValue(undefined);

        await controller.bulkAction(bulkActionDto);

        expect(service.bulkUpdate).toHaveBeenCalledWith([], {
          isPublished: true,
          publishedAt: expect.any(Date),
        });
      });
    });
  });
});
