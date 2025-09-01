import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StarknetNewsService } from './starknet-news.service';
import { StarknetNews } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

const mockNewsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  preload: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  softDelete: jest.fn(),
  recover: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  })),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('StarknetNewsService', () => {
  let service: StarknetNewsService;
  let repository: MockRepository<StarknetNews>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarknetNewsService,
        {
          provide: getRepositoryToken(StarknetNews),
          useFactory: mockNewsRepository,
        },
      ],
    }).compile();

    service = module.get<StarknetNewsService>(StarknetNewsService);
    repository = module.get<MockRepository<StarknetNews>>(
      getRepositoryToken(StarknetNews),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a news article', async () => {
      const createNewsDto: CreateNewsDto = {
        title: 'Test News',
        content: 'Test content',
        category: 'general',
        isPublished: true,
      };

      const mockNews = {
        id: '1',
        ...createNewsDto,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockReturnValue(mockNews);
      repository.save.mockResolvedValue(mockNews);

      const result = await service.create(createNewsDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createNewsDto,
        publishedAt: expect.any(Date),
      });
      expect(repository.save).toHaveBeenCalledWith(mockNews);
      expect(result).toEqual(mockNews);
    });
  });

  describe('findOne', () => {
    it('should return a news article if found', async () => {
      const mockNews = {
        id: '1',
        title: 'Test News',
        content: 'Test content',
      };

      repository.findOne.mockResolvedValue(mockNews);

      const result = await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockNews);
    });

    it('should throw NotFoundException if news article not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublished', () => {
    it('should return published news articles', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Published News',
          content: 'Content',
          isPublished: true,
        },
      ];

      repository.find.mockResolvedValue(mockNews);

      const result = await service.findPublished();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isPublished: true },
        order: { publishedAt: 'DESC' },
      });
      expect(result).toEqual(mockNews);
    });
  });

  describe('update', () => {
    it('should successfully update a news article', async () => {
      const updateNewsDto: UpdateNewsDto = {
        title: 'Updated News',
      };

      const existingNews = {
        id: '1',
        title: 'Test News',
        content: 'Test content',
        isPublished: false,
      };

      const updatedNews = {
        ...existingNews,
        ...updateNewsDto,
      };

      repository.findOne.mockResolvedValue(existingNews);
      repository.preload.mockResolvedValue(updatedNews);
      repository.save.mockResolvedValue(updatedNews);

      const result = await service.update('1', updateNewsDto);

      expect(repository.preload).toHaveBeenCalledWith({
        id: '1',
        ...updateNewsDto,
      });
      expect(repository.save).toHaveBeenCalledWith(updatedNews);
      expect(result).toEqual(updatedNews);
    });

    it('should throw NotFoundException if news article not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully remove a news article', async () => {
      const mockNews = {
        id: '1',
        title: 'Test News',
        content: 'Test content',
      };

      repository.findOne.mockResolvedValue(mockNews);
      repository.remove.mockResolvedValue(mockNews);

      await service.remove('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.remove).toHaveBeenCalledWith(mockNews);
    });
  });

  describe('engagement tracking', () => {
    describe('incrementViewCount', () => {
      it('should increment view count', async () => {
        repository.increment.mockResolvedValue(undefined);

        await service.incrementViewCount('1');

        expect(repository.increment).toHaveBeenCalledWith(
          { id: '1' },
          'viewCount',
          1,
        );
      });
    });

    describe('incrementLikeCount', () => {
      it('should increment like count', async () => {
        repository.increment.mockResolvedValue(undefined);

        await service.incrementLikeCount('1');

        expect(repository.increment).toHaveBeenCalledWith(
          { id: '1' },
          'likeCount',
          1,
        );
      });
    });

    describe('decrementLikeCount', () => {
      it('should decrement like count', async () => {
        repository.decrement.mockResolvedValue(undefined);

        await service.decrementLikeCount('1');

        expect(repository.decrement).toHaveBeenCalledWith(
          { id: '1' },
          'likeCount',
          1,
        );
      });
    });

    describe('incrementShareCount', () => {
      it('should increment share count', async () => {
        repository.increment.mockResolvedValue(undefined);

        await service.incrementShareCount('1');

        expect(repository.increment).toHaveBeenCalledWith(
          { id: '1' },
          'shareCount',
          1,
        );
      });
    });
  });

  describe('analytics and statistics', () => {
    describe('getNewsStatistics', () => {
      it('should return comprehensive news statistics', async () => {
        const mockStats = {
          totalNews: 100,
          publishedNews: 80,
          draftNews: 20,
          scheduledNews: 5,
          totalViews: 1000,
          totalLikes: 200,
          totalShares: 50,
          categoriesCount: 5,
        };

        const mockTagsResult = { tagsCount: 15 };

        const queryBuilder = repository.createQueryBuilder();
        queryBuilder.getRawOne
          .mockResolvedValueOnce(mockStats)
          .mockResolvedValueOnce(mockTagsResult);

        const result = await service.getNewsStatistics();

        expect(result).toEqual({ ...mockStats, tagsCount: 15 });
      });
    });

    describe('getPopularNews', () => {
      it('should return popular news articles', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Popular News',
            viewCount: 1000,
            likeCount: 100,
          },
        ];

        repository.find.mockResolvedValue(mockNews);

        const result = await service.getPopularNews(5);

        expect(repository.find).toHaveBeenCalledWith({
          where: { isPublished: true, deletedAt: expect.anything() },
          order: { viewCount: 'DESC', likeCount: 'DESC' },
          take: 5,
        });
        expect(result).toEqual(mockNews);
      });
    });

    describe('getTrendingNews', () => {
      it('should return trending news articles', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Trending News',
            publishedAt: new Date(),
            viewCount: 500,
          },
        ];

        repository.find.mockResolvedValue(mockNews);

        const result = await service.getTrendingNews(7, 10);

        expect(repository.find).toHaveBeenCalledWith({
          where: {
            isPublished: true,
            publishedAt: expect.any(Object),
            deletedAt: expect.anything(),
          },
          order: { viewCount: 'DESC', likeCount: 'DESC' },
          take: 10,
        });
        expect(result).toEqual(mockNews);
      });
    });

    describe('getFeaturedNews', () => {
      it('should return featured news articles', async () => {
        const mockNews = [
          {
            id: '1',
            title: 'Featured News',
            isFeatured: true,
          },
        ];

        repository.find.mockResolvedValue(mockNews);

        const result = await service.getFeaturedNews();

        expect(repository.find).toHaveBeenCalledWith({
          where: {
            isPublished: true,
            isFeatured: true,
            deletedAt: expect.anything(),
          },
          order: { publishedAt: 'DESC' },
        });
        expect(result).toEqual(mockNews);
      });
    });
  });

  describe('soft delete functionality', () => {
    describe('softRemove', () => {
      it('should soft delete a news article', async () => {
        const mockNews = {
          id: '1',
          title: 'Test News',
          content: 'Test content',
        };

        repository.findOne.mockResolvedValue(mockNews);
        repository.softRemove.mockResolvedValue(mockNews);

        await service.softRemove('1');

        expect(repository.softRemove).toHaveBeenCalledWith(mockNews);
      });
    });

    describe('restore', () => {
      it('should restore a soft deleted news article', async () => {
        const mockNews = {
          id: '1',
          title: 'Test News',
          deletedAt: new Date(),
        };

        repository.findOne.mockResolvedValue(mockNews);
        repository.recover.mockResolvedValue({ ...mockNews, deletedAt: null });

        const result = await service.restore('1');

        expect(repository.findOne).toHaveBeenCalledWith({
          where: { id: '1' },
          withDeleted: true,
        });
        expect(repository.recover).toHaveBeenCalledWith(mockNews);
        expect(result.deletedAt).toBeNull();
      });
    });
  });

  describe('content validation', () => {
    it('should validate content and throw error for invalid data', async () => {
      const invalidDto: CreateNewsDto = {
        title: 'Short', // Too short
        content: 'Too short', // Too short
        tags: new Array(15).fill('tag'), // Too many tags
        slug: 'Invalid Slug!', // Invalid characters
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulk operations', () => {
    describe('bulkUpdate', () => {
      it('should update multiple news articles', async () => {
        const ids = ['1', '2', '3'];
        const updateData = { isPublished: true };

        repository.update.mockResolvedValue(undefined);

        await service.bulkUpdate(ids, updateData);

        expect(repository.update).toHaveBeenCalledWith(ids, updateData);
      });
    });

    describe('bulkDelete', () => {
      it('should soft delete multiple news articles', async () => {
        const ids = ['1', '2', '3'];

        repository.softDelete.mockResolvedValue(undefined);

        await service.bulkDelete(ids);

        expect(repository.softDelete).toHaveBeenCalledWith(ids);
      });
    });
  });
});
