import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { StarknetNews } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

@Injectable()
export class StarknetNewsService {
  constructor(
    @InjectRepository(StarknetNews)
    private readonly newsRepository: Repository<StarknetNews>,
  ) {}

  async create(createNewsDto: CreateNewsDto): Promise<StarknetNews> {
    const news = this.newsRepository.create({
      ...createNewsDto,
      publishedAt: createNewsDto.isPublished ? new Date() : null,
    });
    return await this.newsRepository.save(news);
  }

  async findAll(queryDto: QueryNewsDto): Promise<{
    data: StarknetNews[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      category,
      isPublished,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'DESC',
    } = queryDto;

    const whereConditions: FindOptionsWhere<StarknetNews> = {};

    if (category !== undefined) {
      whereConditions.category = category;
    }

    if (isPublished !== undefined) {
      whereConditions.isPublished = isPublished;
    }

    const queryBuilder = this.newsRepository.createQueryBuilder('news');

    // Apply where conditions
    Object.entries(whereConditions).forEach(([key, value]) => {
      queryBuilder.andWhere(`news.${key} = :${key}`, { [key]: value });
    });

    // Apply search if provided
    if (search) {
      queryBuilder.andWhere(
        '(news.title ILIKE :search OR news.content ILIKE :search OR news.summary ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const validSortFields = ['publishedAt', 'createdAt', 'title', 'category'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'publishedAt';
    queryBuilder.orderBy(`news.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<StarknetNews> {
    const news = await this.newsRepository.findOne({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News article with ID ${id} not found`);
    }

    return news;
  }

  async findPublished(): Promise<StarknetNews[]> {
    return await this.newsRepository.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
    });
  }

  async findByCategory(category: string): Promise<StarknetNews[]> {
    return await this.newsRepository.find({
      where: { category, isPublished: true },
      order: { publishedAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateNewsDto: UpdateNewsDto,
  ): Promise<StarknetNews> {
    const existingNews = await this.findOne(id);

    // Set publishedAt if changing from unpublished to published
    const updatedData: Partial<StarknetNews> = { ...updateNewsDto };
    if (updateNewsDto.isPublished === true && !existingNews.isPublished) {
      updatedData.publishedAt = new Date();
    } else if (updateNewsDto.isPublished === false) {
      updatedData.publishedAt = null;
    }

    const news = await this.newsRepository.preload({
      id,
      ...updatedData,
    });

    if (!news) {
      throw new NotFoundException(`News article with ID ${id} not found`);
    }

    return await this.newsRepository.save(news);
  }

  async remove(id: string): Promise<void> {
    const news = await this.findOne(id);
    await this.newsRepository.remove(news);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.newsRepository
      .createQueryBuilder('news')
      .select('DISTINCT news.category', 'category')
      .where('news.isPublished = :isPublished', { isPublished: true })
      .getRawMany();

    return result.map((item) => item.category);
  }
}
