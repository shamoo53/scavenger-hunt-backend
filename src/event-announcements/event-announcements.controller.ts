import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

@Controller('event-announcements')
export class EventAnnouncementsController {
  constructor(
    private readonly announcementsService: EventAnnouncementsService,
  ) {}

  @Post()
  async create(@Body() createEventAnnouncementDto: CreateEventAnnouncementDto) {
    return await this.announcementsService.create(createEventAnnouncementDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryEventAnnouncementDto) {
    return await this.announcementsService.findAll(queryDto);
  }

  @Get('published')
  async findPublished() {
    return await this.announcementsService.findPublished();
  }

  @Get('featured')
  async getFeaturedAnnouncements() {
    return await this.announcementsService.getFeaturedAnnouncements();
  }

  @Get('pinned')
  async getPinnedAnnouncements() {
    return await this.announcementsService.getPinnedAnnouncements();
  }

  @Get('popular')
  async getPopularAnnouncements(
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.announcementsService.getPopularAnnouncements(limit);
  }

  @Get('trending')
  async getTrendingAnnouncements(
    @Query('days', ParseIntPipe) days: number = 7,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.announcementsService.getTrendingAnnouncements(
      days,
      limit,
    );
  }

  @Get('by-tags')
  async getAnnouncementsByTags(
    @Query('tags') tags: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    if (!tags) {
      throw new BadRequestException('Tags parameter is required');
    }

    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagArray.length === 0) {
      throw new BadRequestException('At least one tag must be provided');
    }

    return await this.announcementsService.getAnnouncementsByTags(
      tagArray,
      limit,
    );
  }

  @Get('types')
  async getTypes() {
    return await this.announcementsService.getTypes();
  }

  @Get('categories')
  async getCategories() {
    return await this.announcementsService.getCategories();
  }

  @Get('tags')
  async getAllTags() {
    return await this.announcementsService.getAllTags();
  }

  @Get('statistics')
  async getStatistics() {
    return await this.announcementsService.getAnnouncementStatistics();
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    // Validate that the type is a valid AnnouncementType
    if (!Object.values(AnnouncementType).includes(type as AnnouncementType)) {
      throw new BadRequestException(`Invalid announcement type: ${type}`);
    }

    return await this.announcementsService.findByType(type as AnnouncementType);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return await this.announcementsService.findByCategory(category);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const announcement = await this.announcementsService.findOne(id);

    // Auto-increment view count when viewing an announcement
    await this.announcementsService.incrementViewCount(id);

    return announcement;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventAnnouncementDto: UpdateEventAnnouncementDto,
  ) {
    return await this.announcementsService.update(
      id,
      updateEventAnnouncementDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.softRemove(id);
  }

  // Engagement tracking endpoints
  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.incrementViewCount(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementLike(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.incrementLikeCount(id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async decrementLike(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.decrementLikeCount(id);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementShare(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.incrementShareCount(id);
  }

  // Admin endpoints
  @Post(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.restore(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.announcementsService.remove(id);
  }

  @Post('bulk-action')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkAction(@Body() bulkActionDto: BulkAnnouncementActionDto) {
    const { ids, action } = bulkActionDto;

    switch (action) {
      case 'publish':
        await this.announcementsService.bulkUpdate(ids, {
          isPublished: true,
          publishedAt: new Date(),
        });
        break;

      case 'unpublish':
        await this.announcementsService.bulkUpdate(ids, {
          isPublished: false,
          publishedAt: null,
        });
        break;

      case 'activate':
        await this.announcementsService.bulkUpdate(ids, {
          isActive: true,
        });
        break;

      case 'deactivate':
        await this.announcementsService.bulkUpdate(ids, {
          isActive: false,
        });
        break;

      case 'feature':
        await this.announcementsService.bulkUpdate(ids, {
          isFeatured: true,
        });
        break;

      case 'unfeature':
        await this.announcementsService.bulkUpdate(ids, {
          isFeatured: false,
        });
        break;

      case 'pin':
        await this.announcementsService.bulkUpdate(ids, {
          isPinned: true,
        });
        break;

      case 'unpin':
        await this.announcementsService.bulkUpdate(ids, {
          isPinned: false,
        });
        break;

      case 'delete':
      case 'archive':
        await this.announcementsService.bulkDelete(ids);
        break;

      case 'high-priority':
        await this.announcementsService.bulkUpdate(ids, {
          priority: AnnouncementPriority.HIGH,
        });
        break;

      case 'urgent-priority':
        await this.announcementsService.bulkUpdate(ids, {
          priority: AnnouncementPriority.URGENT,
        });
        break;

      case 'normal-priority':
        await this.announcementsService.bulkUpdate(ids, {
          priority: AnnouncementPriority.NORMAL,
        });
        break;

      case 'low-priority':
        await this.announcementsService.bulkUpdate(ids, {
          priority: AnnouncementPriority.LOW,
        });
        break;

      case 'enable-comments':
        await this.announcementsService.bulkUpdate(ids, {
          allowComments: true,
        });
        break;

      case 'disable-comments':
        await this.announcementsService.bulkUpdate(ids, {
          allowComments: false,
        });
        break;

      case 'enable-notifications':
        await this.announcementsService.bulkUpdate(ids, {
          notifyUsers: true,
        });
        break;

      case 'disable-notifications':
        await this.announcementsService.bulkUpdate(ids, {
          notifyUsers: false,
        });
        break;

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }
}
