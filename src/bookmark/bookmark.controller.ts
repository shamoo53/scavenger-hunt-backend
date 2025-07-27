import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BookmarkService, BookmarkListResult } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { QueryBookmarkDto } from './dto/query-bookmark.dto';
import { Bookmark } from './entities/bookmark.entity';

@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBookmarkDto: CreateBookmarkDto): Promise<Bookmark> {
    return this.bookmarkService.create(createBookmarkDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryBookmarkDto): Promise<BookmarkListResult> {
    return this.bookmarkService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Bookmark> {
    return this.bookmarkService.findOne(id);
  }

  @Get('player/:playerId/stats')
  async getPlayerStats(@Param('playerId', ParseUUIDPipe) playerId: string) {
    const [totalCount, countByType] = await Promise.all([
      this.bookmarkService.getPlayerBookmarkCount(playerId),
      this.bookmarkService.getPlayerBookmarksByType(playerId),
    ]);

    return {
      totalCount,
      countByType,
    };
  }

  @Get('check/:playerId/:itemId/:type')
  async checkBookmark(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('type') type: string,
  ): Promise<{ bookmarked: boolean; bookmark?: Bookmark }> {
    const bookmark = await this.bookmarkService.findByPlayerAndItem(playerId, itemId, type);
    
    return {
      bookmarked: !!bookmark,
      bookmark: bookmark || undefined,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
  ): Promise<Bookmark> {
    return this.bookmarkService.update(id, updateBookmarkDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.bookmarkService.remove(id);
  }

  @Delete('player/:playerId/item/:itemId/type/:type')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByPlayerAndItem(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('type') type: string,
  ): Promise<{ removed: boolean }> {
    const removed = await this.bookmarkService.removeByPlayerAndItem(playerId, itemId, type);
    return { removed };
  }
}
