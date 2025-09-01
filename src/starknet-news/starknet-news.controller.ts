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
  Put,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { StarknetNewsService } from './starknet-news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { BulkNewsActionDto } from './dto/news-analytics.dto';

@Controller('starknet-news')
export class StarknetNewsController {
  constructor(private readonly starknetNewsService: StarknetNewsService) {}

  @Post()
  async create(@Body() createNewsDto: CreateNewsDto) {
    return await this.starknetNewsService.create(createNewsDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryNewsDto) {
    return await this.starknetNewsService.findAll(queryDto);
  }

  @Get('published')
  async findPublished() {
    return await this.starknetNewsService.findPublished();
  }

  @Get('featured')
  async getFeaturedNews() {
    return await this.starknetNewsService.getFeaturedNews();
  }

  @Get('popular')
  async getPopularNews(@Query('limit', ParseIntPipe) limit: number = 10) {
    return await this.starknetNewsService.getPopularNews(limit);
  }

  @Get('trending')
  async getTrendingNews(
    @Query('days', ParseIntPipe) days: number = 7,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.starknetNewsService.getTrendingNews(days, limit);
  }

  @Get('categories')
  async getCategories() {
    return await this.starknetNewsService.getCategories();
  }

  @Get('tags')
  async getAllTags() {
    return await this.starknetNewsService.getAllTags();
  }

  @Get('statistics')
  async getStatistics() {
    return await this.starknetNewsService.getNewsStatistics();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return await this.starknetNewsService.findByCategory(category);
  }

  @Get('tags/:tags')
  async getNewsByTags(
    @Param('tags') tagsString: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    const tags = tagsString.split(',').map((tag) => tag.trim());
    return await this.starknetNewsService.getNewsByTags(tags, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const news = await this.starknetNewsService.findOne(id);
    // Increment view count when news is accessed
    await this.starknetNewsService.incrementViewCount(id);
    return news;
  }

  // Engagement endpoints
  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.incrementViewCount(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementLike(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.incrementLikeCount(id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async decrementLike(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.decrementLikeCount(id);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementShare(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.incrementShareCount(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return await this.starknetNewsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.softRemove(id);
  }

  // Admin endpoints for managing archived content
  @Put(':id/restore')
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return await this.starknetNewsService.restore(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.starknetNewsService.remove(id);
  }

  // Bulk operations
  @Post('bulk/action')
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkAction(@Body() bulkActionDto: BulkNewsActionDto) {
    const { ids, action } = bulkActionDto;

    switch (action) {
      case 'publish':
        await this.starknetNewsService.bulkUpdate(ids, {
          isPublished: true,
          publishedAt: new Date(),
        });
        break;
      case 'unpublish':
        await this.starknetNewsService.bulkUpdate(ids, {
          isPublished: false,
          publishedAt: null,
        });
        break;
      case 'delete':
      case 'archive':
        await this.starknetNewsService.bulkDelete(ids);
        break;
      case 'feature':
        await this.starknetNewsService.bulkUpdate(ids, { isFeatured: true });
        break;
      case 'unfeature':
        await this.starknetNewsService.bulkUpdate(ids, { isFeatured: false });
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
