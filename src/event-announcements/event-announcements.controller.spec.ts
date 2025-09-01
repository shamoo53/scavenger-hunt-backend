import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventAnnouncementsController } from './event-announcements.controller';
import { EventAnnouncementsService } from './event-announcements.service';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';
import {
  QueryEventAnnouncementDto,
  BulkAnnouncementActionDto,
} from './dto/query-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
} from './enums/announcement.enum';

describe('EventAnnouncementsController', () => {
  let controller: EventAnnouncementsController;
  let service: EventAnnouncementsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findPublished: jest.fn(),
    findByType: jest.fn(),
    findByCategory: jest.fn(),
    getFeaturedAnnouncements: jest.fn(),
    getPinnedAnnouncements: jest.fn(),
    getPopularAnnouncements: jest.fn(),
    getTrendingAnnouncements: jest.fn(),
    getAnnouncementsByTags: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    incrementViewCount: jest.fn(),
    incrementLikeCount: jest.fn(),
    decrementLikeCount: jest.fn(),
    incrementShareCount: jest.fn(),
    getTypes: jest.fn(),
    getCategories: jest.fn(),
    getAllTags: jest.fn(),
    getAnnouncementStatistics: jest.fn(),
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAnnouncementsController],
      providers: [
        {
          provide: EventAnnouncementsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EventAnnouncementsController>(
      EventAnnouncementsController,
    );
    service = module.get<EventAnnouncementsService>(EventAnnouncementsService);

    Object.values(mockService).forEach((mock) => mock.mockClear());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new announcement', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'StarkNet Gaming Championship 2024',
        content:
          'Join the biggest gaming tournament of the year with amazing prizes.',
        type: AnnouncementType.COMPETITION,
        priority: AnnouncementPriority.HIGH,
        category: 'gaming',
        tags: ['championship', 'gaming'],
        createdBy: 'admin-user-id',
      };

      const mockResult = {
        id: 'announcement-123',
        ...createDto,
        slug: 'starknet-gaming-championship-2024',
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated announcements with filtering', async () => {
      const queryDto: QueryEventAnnouncementDto = {
        page: 1,
        limit: 10,
        type: AnnouncementType.COMPETITION,
        isPublished: true,
      };

      const mockResult = {
        data: [
          {
            id: 'announcement-1',
            title: 'Gaming Championship',
            type: AnnouncementType.COMPETITION,
            isPublished: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(mockService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('content discovery', () => {
    it('should find published announcements', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Published Tournament', isPublished: true },
      ];

      mockService.findPublished.mockResolvedValue(mockAnnouncements);

      const result = await controller.findPublished();

      expect(mockService.findPublished).toHaveBeenCalled();
      expect(result).toEqual(mockAnnouncements);
    });

    it('should find announcements by type', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Competition', type: AnnouncementType.COMPETITION },
      ];

      mockService.findByType.mockResolvedValue(mockAnnouncements);

      const result = await controller.findByType('competition');

      expect(mockService.findByType).toHaveBeenCalledWith('competition');
      expect(result).toEqual(mockAnnouncements);
    });

    it('should throw error for invalid announcement type', async () => {
      await expect(controller.findByType('invalid-type')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should find announcements by tags', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Tagged Event', tags: ['gaming', 'tournament'] },
      ];

      mockService.getAnnouncementsByTags.mockResolvedValue(mockAnnouncements);

      const result = await controller.getAnnouncementsByTags(
        'gaming,tournament',
        20,
      );

      expect(mockService.getAnnouncementsByTags).toHaveBeenCalledWith(
        ['gaming', 'tournament'],
        20,
      );
      expect(result).toEqual(mockAnnouncements);
    });

    it('should handle whitespace in tags', async () => {
      mockService.getAnnouncementsByTags.mockResolvedValue([]);

      await controller.getAnnouncementsByTags(' gaming , tournament ', 15);

      expect(mockService.getAnnouncementsByTags).toHaveBeenCalledWith(
        ['gaming', 'tournament'],
        15,
      );
    });
  });

  describe('metadata endpoints', () => {
    it('should get announcement types', async () => {
      const types = Object.values(AnnouncementType);
      mockService.getTypes.mockResolvedValue(types);

      const result = await controller.getTypes();

      expect(result).toEqual(types);
    });

    it('should get categories', async () => {
      const categories = ['gaming', 'tournament', 'maintenance'];
      mockService.getCategories.mockResolvedValue(categories);

      const result = await controller.getCategories();

      expect(result).toEqual(categories);
    });

    it('should get statistics', async () => {
      const stats = {
        totalAnnouncements: 100,
        publishedAnnouncements: 80,
        totalViews: 10000,
        totalLikes: 1500,
      };
      mockService.getAnnouncementStatistics.mockResolvedValue(stats);

      const result = await controller.getStatistics();

      expect(result).toEqual(stats);
    });
  });

  describe('individual operations', () => {
    const testId = 'announcement-123';

    it('should find one and increment view count', async () => {
      const mockAnnouncement = {
        id: testId,
        title: 'Test Tournament',
        viewCount: 150,
      };

      mockService.findOne.mockResolvedValue(mockAnnouncement);
      mockService.incrementViewCount.mockResolvedValue(undefined);

      const result = await controller.findOne(testId);

      expect(mockService.findOne).toHaveBeenCalledWith(testId);
      expect(mockService.incrementViewCount).toHaveBeenCalledWith(testId);
      expect(result).toEqual(mockAnnouncement);
    });

    it('should update announcement', async () => {
      const updateDto: UpdateEventAnnouncementDto = {
        title: 'Updated Tournament',
        isFeatured: true,
      };

      const mockUpdated = {
        id: testId,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(testId, updateDto);

      expect(mockService.update).toHaveBeenCalledWith(testId, updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('engagement tracking', () => {
    const testId = 'announcement-123';

    it('should increment like count', async () => {
      mockService.incrementLikeCount.mockResolvedValue(undefined);

      await controller.incrementLike(testId);

      expect(mockService.incrementLikeCount).toHaveBeenCalledWith(testId);
    });

    it('should decrement like count', async () => {
      mockService.decrementLikeCount.mockResolvedValue(undefined);

      await controller.decrementLike(testId);

      expect(mockService.decrementLikeCount).toHaveBeenCalledWith(testId);
    });

    it('should increment share count', async () => {
      mockService.incrementShareCount.mockResolvedValue(undefined);

      await controller.incrementShare(testId);

      expect(mockService.incrementShareCount).toHaveBeenCalledWith(testId);
    });
  });

  describe('bulk operations', () => {
    const testIds = ['id1', 'id2', 'id3'];

    it('should perform bulk publish', async () => {
      const bulkAction: BulkAnnouncementActionDto = {
        ids: testIds,
        action: 'publish',
      };

      mockService.bulkUpdate.mockResolvedValue(undefined);

      await controller.bulkAction(bulkAction);

      expect(mockService.bulkUpdate).toHaveBeenCalledWith(testIds, {
        isPublished: true,
        publishedAt: expect.any(Date),
      });
    });

    it('should perform bulk feature', async () => {
      const bulkAction: BulkAnnouncementActionDto = {
        ids: testIds,
        action: 'feature',
      };

      mockService.bulkUpdate.mockResolvedValue(undefined);

      await controller.bulkAction(bulkAction);

      expect(mockService.bulkUpdate).toHaveBeenCalledWith(testIds, {
        isFeatured: true,
      });
    });

    it('should perform bulk delete', async () => {
      const bulkAction: BulkAnnouncementActionDto = {
        ids: testIds,
        action: 'delete',
      };

      mockService.bulkDelete.mockResolvedValue(undefined);

      await controller.bulkAction(bulkAction);

      expect(mockService.bulkDelete).toHaveBeenCalledWith(testIds);
    });

    it('should handle priority actions', async () => {
      const bulkAction: BulkAnnouncementActionDto = {
        ids: testIds,
        action: 'high-priority',
      };

      mockService.bulkUpdate.mockResolvedValue(undefined);

      await controller.bulkAction(bulkAction);

      expect(mockService.bulkUpdate).toHaveBeenCalledWith(testIds, {
        priority: AnnouncementPriority.HIGH,
      });
    });

    it('should throw error for unknown action', async () => {
      const bulkAction: BulkAnnouncementActionDto = {
        ids: testIds,
        action: 'unknown-action' as any,
      };

      await expect(controller.bulkAction(bulkAction)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
