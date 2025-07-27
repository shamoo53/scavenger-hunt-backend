import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookmarkService } from '../src/bookmark/bookmark.service';
import { Bookmark, BookmarkType } from '../src/bookmark/entities/bookmark.entity';
import { CreateBookmarkDto } from '../src/bookmark/dto/create-bookmark.dto';
import { UpdateBookmarkDto } from '../src/bookmark/dto/update-bookmark.dto';
import { QueryBookmarkDto } from '../src/bookmark/dto/query-bookmark.dto';

describe('BookmarkService', () => {
  let service: BookmarkService;
  let repository: jest.Mocked<Repository<Bookmark>>;

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
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        {
          provide: getRepositoryToken(Bookmark),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BookmarkService>(BookmarkService);
    repository = module.get(getRepositoryToken(Bookmark));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateBookmarkDto = {
      playerId: '123e4567-e89b-12d3-a456-426614174001',
      itemId: '123e4567-e89b-12d3-a456-426614174002',
      type: BookmarkType.PUZZLE,
      title: 'Test Puzzle',
    };

    it('should create a bookmark successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockBookmark);
      repository.save.mockResolvedValue(mockBookmark);

      const result = await service.create(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          playerId: createDto.playerId,
          itemId: createDto.itemId,
          type: createDto.type,
        },
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockBookmark);
      expect(result).toEqual(mockBookmark);
    });

    it('should throw ConflictException if bookmark already exists', async () => {
      repository.findOne.mockResolvedValue(mockBookmark);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryBookmarkDto = {
      playerId: '123e4567-e89b-12d3-a456-426614174001',
      limit: 10,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    it('should return paginated bookmarks', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBookmark], 1]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        bookmarks: [mockBookmark],
        total: 1,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('findOne', () => {
    const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return a bookmark by ID', async () => {
      repository.findOne.mockResolvedValue(mockBookmark);

      const result = await service.findOne(bookmarkId);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: bookmarkId } });
      expect(result).toEqual(mockBookmark);
    });

    it('should throw NotFoundException if bookmark not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(bookmarkId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';
    const updateDto: UpdateBookmarkDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update a bookmark', async () => {
      const updatedBookmark = { ...mockBookmark, ...updateDto };
      repository.findOne.mockResolvedValue(mockBookmark);
      repository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update(bookmarkId, updateDto);

      expect(repository.save).toHaveBeenCalledWith({
        ...mockBookmark,
        ...updateDto,
      });
      expect(result).toEqual(updatedBookmark);
    });

    it('should throw NotFoundException if bookmark not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(bookmarkId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const bookmarkId = '123e4567-e89b-12d3-a456-426614174000';

    it('should remove a bookmark', async () => {
      repository.findOne.mockResolvedValue(mockBookmark);
      repository.remove.mockResolvedValue(mockBookmark);

      await service.remove(bookmarkId);

      expect(repository.remove).toHaveBeenCalledWith(mockBookmark);
    });

    it('should throw NotFoundException if bookmark not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(bookmarkId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeByPlayerAndItem', () => {
    it('should remove bookmark by player and item', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.removeByPlayerAndItem(
        'player-id',
        'item-id',
        'puzzle'
      );

      expect(result).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith({
        playerId: 'player-id',
        itemId: 'item-id',
        type: 'puzzle',
      });
    });

    it('should return false if no bookmark was removed', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.removeByPlayerAndItem(
        'player-id',
        'item-id',
        'puzzle'
      );

      expect(result).toBe(false);
    });
  });

  describe('getPlayerBookmarkCount', () => {
    it('should return bookmark count for a player', async () => {
      repository.count.mockResolvedValue(5);

      const result = await service.getPlayerBookmarkCount('player-id');

      expect(result).toBe(5);
      expect(repository.count).toHaveBeenCalledWith({ where: { playerId: 'player-id' } });
    });
  });

  describe('getPlayerBookmarksByType', () => {
    it('should return bookmark counts by type for a player', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: 'puzzle', count: '3' },
          { type: 'resource', count: '2' },
        ]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPlayerBookmarksByType('player-id');

      expect(result).toEqual({
        puzzle: 3,
        resource: 2,
      });
    });
  });
});
