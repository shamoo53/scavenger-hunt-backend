import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncement } from './entities/event-announcement.entity';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';
import { QueryEventAnnouncementDto } from './dto/query-event-announcement.dto';
import {
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
} from './enums/announcement.enum';

describe('EventAnnouncementsService', () => {
  let service: EventAnnouncementsService;
  let repository: Repository<EventAnnouncement>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    softDelete: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    count: jest.fn(),
    sum: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventAnnouncementsService,
        {
          provide: getRepositoryToken(EventAnnouncement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventAnnouncementsService>(EventAnnouncementsService);
    repository = module.get<Repository<EventAnnouncement>>(
      getRepositoryToken(EventAnnouncement),
    );

    // Reset all mocks
    Object.values(mockRepository).forEach((mock) => mock.mockClear());
    Object.values(mockQueryBuilder).forEach((mock) => mock.mockClear());
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new announcement successfully', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Test Gaming Tournament 2024',
        content:
          'Join us for an exciting gaming tournament with great prizes and challenges for all skill levels.',
        type: AnnouncementType.COMPETITION,
        priority: AnnouncementPriority.HIGH,
        category: 'gaming',
        tags: ['tournament', 'gaming', 'competition'],
        eventDate: new Date('2024-03-15T10:00:00Z'),
        location: 'Virtual',
        maxParticipants: 100,
        createdBy: 'admin-123',
        createdByName: 'Admin User',
      };

      const mockResult = {
        id: 'announcement-123',
        ...createDto,
        slug: 'test-gaming-tournament-2024',
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        clickCount: 0,
        acknowledgeCount: 0,
        currentParticipants: 0,
        readingTimeMinutes: 1,
        isPublished: true,
        isActive: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockResult);
      mockRepository.save.mockResolvedValue(mockResult);
      mockRepository.findOne.mockResolvedValue(null); // For slug uniqueness check

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          content: expect.any(String), // Sanitized content
          readingTimeMinutes: expect.any(Number),
          slug: expect.any(String),
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException for invalid title', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Short', // Too short
        content:
          'This is a valid content that meets the minimum length requirements for announcement creation.',
        createdBy: 'admin-123',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid content', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Valid Tournament Title 2024',
        content: 'Short', // Too short
        createdBy: 'admin-123',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sanitize malicious content', async () => {
      const createDto: CreateEventAnnouncementDto = {
        title: 'Security Test Tournament',
        content:
          'Join our tournament! <script>alert("xss")</script> This is safe content.',
        createdBy: 'admin-123',
      };

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});
      mockRepository.findOne.mockResolvedValue(null);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.not.stringContaining('<script>'),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated announcements with filters', async () => {
      const queryDto: QueryEventAnnouncementDto = {
        page: 1,
        limit: 10,
        type: AnnouncementType.COMPETITION,
        isPublished: true,
        search: 'tournament',
        sortBy: 'eventDate',
        sortOrder: 'ASC',
      };

      const mockData = [
        {
          id: 'announcement-1',
          title: 'Gaming Tournament',
          type: AnnouncementType.COMPETITION,
          isPublished: true,
        },
        {
          id: 'announcement-2',
          title: 'Chess Tournament',
          type: AnnouncementType.COMPETITION,
          isPublished: true,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 2]);

      const result = await service.findAll(queryDto);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'announcement',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.type = :type',
        { type: queryDto.type },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.isPublished = :isPublished',
        { isPublished: queryDto.isPublished },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(announcement.title ILIKE :search OR announcement.content ILIKE :search OR announcement.summary ILIKE :search)',
        { search: '%tournament%' },
      );
      expect(result).toEqual({
        data: mockData,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should handle empty results', async () => {
      const queryDto: QueryEventAnnouncementDto = {
        search: 'nonexistent',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(queryDto);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrevious).toBe(false);
    });

    it('should apply date range filters', async () => {
      const queryDto: QueryEventAnnouncementDto = {
        eventDateAfter: new Date('2024-01-01'),
        eventDateBefore: new Date('2024-12-31'),
        publishedAfter: new Date('2024-01-01'),
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.eventDate >= :eventDateAfter',
        { eventDateAfter: queryDto.eventDateAfter },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.eventDate <= :eventDateBefore',
        { eventDateBefore: queryDto.eventDateBefore },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'announcement.publishedAt >= :publishedAfter',
        { publishedAfter: queryDto.publishedAfter },
      );
    });
  });

  describe('findOne', () => {
    it('should return announcement by id', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Tournament',
        content: 'Tournament content',
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne('announcement-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'announcement-123', deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockAnnouncement);
    });

    it('should throw NotFoundException for non-existent announcement', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update announcement successfully', async () => {
      const existingAnnouncement = {
        id: 'announcement-123',
        title: 'Original Title',
        content: 'Original content that meets minimum length requirements',
        slug: 'original-slug',
        isPublished: false,
      };

      const updateDto: UpdateEventAnnouncementDto = {
        title: 'Updated Tournament Title 2024',
        isPublished: true,
        priority: AnnouncementPriority.URGENT,
      };

      const updatedAnnouncement = {
        ...existingAnnouncement,
        ...updateDto,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingAnnouncement) // First call in update method
        .mockResolvedValueOnce(updatedAnnouncement); // Second call after update

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('announcement-123', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'announcement-123',
        expect.objectContaining({
          title: updateDto.title,
          isPublished: updateDto.isPublished,
          priority: updateDto.priority,
        }),
      );
      expect(result).toEqual(updatedAnnouncement);
    });

    it('should handle publication status changes', async () => {
      const existingAnnouncement = {
        id: 'announcement-123',
        title: 'Test Tournament',
        content: 'Tournament content that meets minimum length requirements',
        isPublished: false,
      };

      const updateDto: UpdateEventAnnouncementDto = {
        isPublished: true,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingAnnouncement)
        .mockResolvedValueOnce({ ...existingAnnouncement, ...updateDto });

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.update('announcement-123', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'announcement-123',
        expect.objectContaining({
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException for non-existent announcement', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const updateDto: UpdateEventAnnouncementDto = {
        title: 'Updated Title',
      };

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove and softRemove', () => {
    it('should permanently remove announcement', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Tournament',
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);
      mockRepository.remove.mockResolvedValue(mockAnnouncement);

      await service.remove('announcement-123');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAnnouncement);
    });

    it('should soft remove announcement', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Tournament',
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);
      mockRepository.softRemove.mockResolvedValue(mockAnnouncement);

      await service.softRemove('announcement-123');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.softRemove).toHaveBeenCalledWith(mockAnnouncement);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted announcement', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        title: 'Test Tournament',
        deletedAt: new Date(),
      };

      const restoredAnnouncement = {
        ...mockAnnouncement,
        deletedAt: null,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockAnnouncement) // Find with deleted
        .mockResolvedValueOnce(restoredAnnouncement); // Find after restore

      mockRepository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore('announcement-123');

      expect(mockRepository.restore).toHaveBeenCalledWith('announcement-123');
      expect(result).toEqual(restoredAnnouncement);
    });

    it('should throw NotFoundException for non-existent announcement', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('engagement tracking', () => {
    it('should increment view count', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      await service.incrementViewCount('announcement-123');

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 'announcement-123' },
        'viewCount',
        1,
      );
    });

    it('should increment like count', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      await service.incrementLikeCount('announcement-123');

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 'announcement-123' },
        'likeCount',
        1,
      );
    });

    it('should decrement like count only if positive', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        likeCount: 5,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);
      mockRepository.decrement.mockResolvedValue({ affected: 1 });

      await service.decrementLikeCount('announcement-123');

      expect(mockRepository.decrement).toHaveBeenCalledWith(
        { id: 'announcement-123' },
        'likeCount',
        1,
      );
    });

    it('should not decrement like count if already zero', async () => {
      const mockAnnouncement = {
        id: 'announcement-123',
        likeCount: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAnnouncement);

      await service.decrementLikeCount('announcement-123');

      expect(mockRepository.decrement).not.toHaveBeenCalled();
    });

    it('should increment share count', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 });

      await service.incrementShareCount('announcement-123');

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 'announcement-123' },
        'shareCount',
        1,
      );
    });
  });

  describe('content discovery methods', () => {
    it('should find published announcements', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Published 1', isPublished: true },
        { id: '2', title: 'Published 2', isPublished: true },
      ];

      mockRepository.find.mockResolvedValue(mockAnnouncements);

      const result = await service.findPublished();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          isActive: true,
          deletedAt: expect.anything(),
        },
        order: { publishedAt: 'DESC', isPinned: 'DESC' },
      });
      expect(result).toEqual(mockAnnouncements);
    });

    it('should find announcements by type', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Competition 1', type: AnnouncementType.COMPETITION },
      ];

      mockRepository.find.mockResolvedValue(mockAnnouncements);

      const result = await service.findByType(AnnouncementType.COMPETITION);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          type: AnnouncementType.COMPETITION,
          isPublished: true,
          isActive: true,
          deletedAt: expect.anything(),
        },
        order: { publishedAt: 'DESC' },
      });
      expect(result).toEqual(mockAnnouncements);
    });

    it('should find featured announcements', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Featured 1', isFeatured: true },
      ];

      mockRepository.find.mockResolvedValue(mockAnnouncements);

      const result = await service.getFeaturedAnnouncements();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          isPublished: true,
          isActive: true,
          deletedAt: expect.anything(),
        },
        order: { priority: 'DESC', publishedAt: 'DESC' },
      });
      expect(result).toEqual(mockAnnouncements);
    });

    it('should find popular announcements', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Popular 1', viewCount: 1000 },
      ];

      mockRepository.find.mockResolvedValue(mockAnnouncements);

      const result = await service.getPopularAnnouncements(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          isActive: true,
          deletedAt: expect.anything(),
        },
        order: {
          viewCount: 'DESC',
          likeCount: 'DESC',
          shareCount: 'DESC',
        },
        take: 5,
      });
      expect(result).toEqual(mockAnnouncements);
    });

    it('should find trending announcements', async () => {
      const mockAnnouncements = [
        { id: '1', title: 'Trending 1', viewCount: 500 },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockAnnouncements);

      const result = await service.getTrendingAnnouncements(7, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'announcement',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'announcement.publishedAt >= :since',
        expect.any(Object),
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockAnnouncements);
    });
  });

  describe('metadata methods', () => {
    it('should get announcement types', async () => {
      const result = await service.getTypes();

      expect(result).toEqual(Object.values(AnnouncementType));
    });

    it('should get categories', async () => {
      const mockCategories = [
        { category: 'gaming' },
        { category: 'competition' },
        { category: 'maintenance' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'announcement',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'DISTINCT announcement.category',
        'category',
      );
      expect(result).toEqual(['gaming', 'competition', 'maintenance']);
    });

    it('should get all tags', async () => {
      const mockAnnouncements = [
        { tags: ['gaming', 'tournament'] },
        { tags: ['competition', 'prizes'] },
        { tags: ['gaming', 'esports'] },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockAnnouncements);

      const result = await service.getAllTags();

      expect(result).toEqual([
        'competition',
        'esports',
        'gaming',
        'prizes',
        'tournament',
      ]);
    });
  });

  describe('statistics', () => {
    it('should get announcement statistics', async () => {
      // Mock all the Promise.all calls
      mockRepository.count
        .mockResolvedValueOnce(100) // totalAnnouncements
        .mockResolvedValueOnce(80) // publishedAnnouncements
        .mockResolvedValueOnce(90) // activeAnnouncements
        .mockResolvedValueOnce(10) // featuredAnnouncements
        .mockResolvedValueOnce(5); // pinnedAnnouncements

      mockRepository.sum
        .mockResolvedValueOnce(5000) // totalViews
        .mockResolvedValueOnce(500) // totalLikes
        .mockResolvedValueOnce(150); // totalShares

      // Mock the async methods
      jest
        .spyOn(service, 'getTypes')
        .mockResolvedValue(Object.values(AnnouncementType));
      jest
        .spyOn(service, 'getCategories')
        .mockResolvedValue(['gaming', 'competition']);
      jest
        .spyOn(service, 'getAllTags')
        .mockResolvedValue(['tag1', 'tag2', 'tag3']);

      const result = await service.getAnnouncementStatistics();

      expect(result).toEqual({
        totalAnnouncements: 100,
        publishedAnnouncements: 80,
        draftAnnouncements: 20,
        activeAnnouncements: 90,
        featuredAnnouncements: 10,
        pinnedAnnouncements: 5,
        totalViews: 5000,
        totalLikes: 500,
        totalShares: 150,
        typesCount: Object.values(AnnouncementType).length,
        categoriesCount: 2,
        tagsCount: 3,
      });
    });
  });

  describe('bulk operations', () => {
    it('should perform bulk update', async () => {
      const ids = ['id1', 'id2', 'id3'];
      const updateData = { isFeatured: true };

      mockRepository.update.mockResolvedValue({ affected: 3 });

      await service.bulkUpdate(ids, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: expect.anything() }, // In() matcher
        updateData,
      );
    });

    it('should handle empty ids array in bulk update', async () => {
      await service.bulkUpdate([], { isFeatured: true });

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should perform bulk delete', async () => {
      const ids = ['id1', 'id2', 'id3'];

      mockRepository.softDelete.mockResolvedValue({ affected: 3 });

      await service.bulkDelete(ids);

      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: expect.anything(), // In() matcher
      });
    });

    it('should handle empty ids array in bulk delete', async () => {
      await service.bulkDelete([]);

      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('scheduled publishing', () => {
    it('should publish scheduled announcements', async () => {
      const scheduledAnnouncements = [
        { id: 'id1', title: 'Scheduled 1' },
        { id: 'id2', title: 'Scheduled 2' },
      ];

      mockRepository.find.mockResolvedValue(scheduledAnnouncements);
      jest.spyOn(service, 'bulkUpdate').mockResolvedValue();

      await service.publishScheduledAnnouncements();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          scheduledFor: expect.anything(), // LessThanOrEqual matcher
          isPublished: false,
          isActive: true,
          deletedAt: expect.anything(),
        },
      });
      expect(service.bulkUpdate).toHaveBeenCalledWith(['id1', 'id2'], {
        isPublished: true,
        publishedAt: expect.any(Date),
        scheduledFor: null,
      });
    });

    it('should handle no scheduled announcements', async () => {
      mockRepository.find.mockResolvedValue([]);
      jest.spyOn(service, 'bulkUpdate').mockResolvedValue();

      await service.publishScheduledAnnouncements();

      expect(service.bulkUpdate).not.toHaveBeenCalled();
    });
  });

  describe('private utility methods', () => {
    it('should validate announcement content correctly', async () => {
      const validDto: CreateEventAnnouncementDto = {
        title: 'Valid Title That Meets Requirements',
        content:
          'This is a valid content that meets the minimum length requirements for announcement creation and testing.',
        createdBy: 'admin-123',
      };

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(validDto)).resolves.not.toThrow();
    });

    it('should calculate reading time correctly', async () => {
      const longContent = 'word '.repeat(200); // 200 words should be ~1 minute
      const createDto: CreateEventAnnouncementDto = {
        title: 'Reading Time Test Tournament',
        content:
          longContent +
          ' This is additional content to test reading time calculation.',
        createdBy: 'admin-123',
      };

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});
      mockRepository.findOne.mockResolvedValue(null);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          readingTimeMinutes: expect.any(Number),
        }),
      );
    });
  });
});
