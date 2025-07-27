import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';

export interface BookmarkListResult {
  bookmarks: Bookmark[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class BookmarkService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  async create(createBookmarkDto: CreateBookmarkDto): Promise<Bookmark> {
    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepository.findOne({
      where: {
        playerId: createBookmarkDto.playerId,
        itemId: createBookmarkDto.itemId,
        type: createBookmarkDto.type,
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Bookmark already exists for this player, item, and type');
    }

    const bookmark = this.bookmarkRepository.create(createBookmarkDto);
    return this.bookmarkRepository.save(bookmark);
  }

  async findAll(queryDto: QueryBookmarkDto): Promise<BookmarkListResult> {
    const { playerId, itemId, type, search, limit, offset, sortBy, sortOrder } = queryDto;
    
    const where: FindOptionsWhere<Bookmark> = {};
    
    if (playerId) where.playerId = playerId;
    if (itemId) where.itemId = itemId;
    if (type) where.type = type;

    const queryBuilder = this.bookmarkRepository.createQueryBuilder('bookmark');
    
    if (playerId) queryBuilder.andWhere('bookmark.playerId = :playerId', { playerId });
    if (itemId) queryBuilder.andWhere('bookmark.itemId = :itemId', { itemId });
    if (type) queryBuilder.andWhere('bookmark.type = :type', { type });
    
    if (search) {
      queryBuilder.andWhere(
        '(bookmark.title ILIKE :search OR bookmark.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy(`bookmark.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .limit(limit)
      .offset(offset);

    const [bookmarks, total] = await queryBuilder.getManyAndCount();

    return {
      bookmarks,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Bookmark> {
    const bookmark = await this.bookmarkRepository.findOne({ where: { id } });
    
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }
    
    return bookmark;
  }

  async findByPlayerAndItem(playerId: string, itemId: string, type: string): Promise<Bookmark | null> {
    return this.bookmarkRepository.findOne({
      where: { playerId, itemId, type: type as any },
    });
  }

  async update(id: string, updateBookmarkDto: UpdateBookmarkDto): Promise<Bookmark> {
    const bookmark = await this.findOne(id);
    
    Object.assign(bookmark, updateBookmarkDto);
    
    return this.bookmarkRepository.save(bookmark);
  }

  async remove(id: string): Promise<void> {
    const bookmark = await this.findOne(id);
    await this.bookmarkRepository.remove(bookmark);
  }

  async removeByPlayerAndItem(playerId: string, itemId: string, type: string): Promise<boolean> {
    const result = await this.bookmarkRepository.delete({
      playerId,
      itemId,
      type: type as any,
    });
    
    return result.affected > 0;
  }

  async getPlayerBookmarkCount(playerId: string): Promise<number> {
    return this.bookmarkRepository.count({ where: { playerId } });
  }

  async getPlayerBookmarksByType(playerId: string): Promise<Record<string, number>> {
    const result = await this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .select('bookmark.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('bookmark.playerId = :playerId', { playerId })
      .groupBy('bookmark.type')
      .getRawMany();

    return result.reduce((acc, { type, count }) => {
      acc[type] = parseInt(count, 10);
      return acc;
    }, {});
  }
}
