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
} from '@nestjs/common';
import { StarknetNewsService } from './starknet-news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

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

  @Get('categories')
  async getCategories() {
    return await this.starknetNewsService.getCategories();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return await this.starknetNewsService.findByCategory(category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.starknetNewsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    return await this.starknetNewsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.starknetNewsService.remove(id);
  }
}
