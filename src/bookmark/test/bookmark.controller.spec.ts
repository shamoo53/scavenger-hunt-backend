import { Test, TestingModule } from '@nestjs/testing';
import { BookmarkController } from '../src/bookmark/bookmark.controller';
import { BookmarkService } from '../src/bookmark/bookmark.service';
import { CreateBookmarkDto } from '../src/bookmark/dto/create-bookmark.dto';
import { UpdateBookmarkDto } from '../src/bookmark/dto/update-bookmark.dto';
import { QueryBookmarkDto } from '../src/bookmark/dto/query-bookmark.dto';
import { Bookmark, BookmarkType } from '../src/bookmark/entities/bookmark.entity';

describe('BookmarkController', () => {
  let controller: BookmarkController;
  let service: jest.Mocked<BookmarkService>;

  const mockBookmark: Bookmark = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    playerId: '123e4567-e89b-12d3-a456-426614174001',
    itemId: '123e4567-e89b-12d3-a456-426614174002',
    type: BookmarkType.PUZZLE,
    title: 'Test Puzzle',
    description: 'A test puzzle',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    metadata: { difficulty: 'easy' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPlayerAndItem: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      removeByPlayerAndItem: jest.fn(),
      getPlayerBookmarkCount: jest.fn(),
      getPlayerBookmarksByType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarkController],
      providers: [
        {
          provide: BookmarkService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BookmarkController>(BookmarkController);
    service = module.get(BookmarkService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bookmark', async () => {
      const createDto: CreateBookmarkDto = {
        playerId: '123e4567-e89b-12d3-a456-426614174001',
        itemId: '123e4567-e89b-12d3-a456-426614174002',
        type: BookmarkType.PUZZLE,
        title: 'Test Puzzle',
      };

      service.create.mockResolvedValue(mockBookmark);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockBookmark);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookmarks', async () => {
      const queryDto: QueryBookmarkDto = {
        limit: 10,
        offset: 0,
      };

      const mockResult = {
        bookmarks: [mockBookmark],
        total: 1,
        limit: 10,
        offset: 0,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a bookmark by ID', async () => {
      const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';

      service.findOne.mockResolvedValue(mockBookmark);

      const result = await controller.findOne(bookmarkId);

      expect(service.findOne).toHaveBeenCalledWith(bookmarkId);
      expect(result).toEqual(mockBookmark);
    });
  });

  describe('getPlayerStats', () => {
    it('should return player bookmark statistics', async () => {
      const playerId = '123e4567-e89b-12d3-a456-426614174001';
      const mockStats = {
        totalCount: 5,
        countByType: { puzzle: 3, resource: 2 },
      };

      service.getPlayerBookmarkCount.mockResolvedValue(5);
      service.getPlayerBookmarksByType.mockResolvedValue({ puzzle: 3, resource: 2 });

      const result = await controller.getPlayerStats(playerId);

      expect(result).toEqual(mockStats);
    });
  });

  describe('checkBookmark', () => {
    it('should check if bookmark exists', async () => {
      service.findByPlayerAndItem.mockResolvedValue(mockBookmark);

      const result = await controller.checkBookmark('player-id', 'item-id', 'puzzle');

      expect(result).toEqual({
        bookmarked: true,
        bookmark: mockBookmark,
      });
    });

    it('should return false if bookmark does not exist', async () => {
      service.findByPlayerAndItem.mockResolvedValue(null);

      const result = await controller.checkBookmark('player-id', 'item-id', 'puzzle');

      expect(result).toEqual({
        bookmarked: false,
        bookmark: undefined,
      });
    });
  });

  describe('update', () => {
    it('should update a bookmark', async () => {
      const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateBookmarkDto = {
        title: 'Updated Title',
      };

      const updatedBookmark = { ...mockBookmark, ...updateDto };
      service.update.mockResolvedValue(updatedBookmark);

      const result = await controller.update(bookmarkId, updateDto);

      expect(service.update).toHaveBeenCalledWith(bookmarkId, updateDto);
      expect(result).toEqual(updatedBookmark);
    });
  });

  describe('remove', () => {
    it('should remove a bookmark', async () => {
      const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';

      service.remove.mockResolvedValue(undefined);

      await controller.remove(bookmarkId);

      expect(service.remove).toHaveBeenCalledWith(bookmarkId);
    });
  });

  describe('removeByPlayerAndItem', () => {
    it('should remove bookmark by player and item', async () => {
      service.removeByPlayerAndItem.mockResolvedValue(true);

      const result = await controller.removeByPlayerAndItem('player-id', 'item-id', 'puzzle');

      expect(service.removeByPlayerAndItem).toHaveBeenCalledWith('player-id', 'item-id', 'puzzle');
      expect(result).toEqual({ removed: true });
    });
  });
});
