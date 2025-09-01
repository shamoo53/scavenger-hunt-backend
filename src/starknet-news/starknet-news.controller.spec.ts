import { Test, TestingModule } from '@nestjs/testing';
import { StarknetNewsController } from './starknet-news.controller';
import { StarknetNewsService } from './starknet-news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

const mockNewsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findPublished: jest.fn(),
  findByCategory: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getCategories: jest.fn(),
});

describe('StarknetNewsController', () => {
  let controller: StarknetNewsController;
  let service: jest.Mocked<StarknetNewsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StarknetNewsController],
      providers: [
        {
          provide: StarknetNewsService,
          useFactory: mockNewsService,
        },
      ],
    }).compile();

    controller = module.get<StarknetNewsController>(StarknetNewsController);
    service = module.get(StarknetNewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a news article', async () => {
      const createNewsDto: CreateNewsDto = {
        title: 'Test News',
        content: 'Test content',
        category: 'general',
        isPublished: true,
      };

      const mockResult = {
        id: '1',
        ...createNewsDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(mockResult as any);

      const result = await controller.create(createNewsDto);

      expect(service.create).toHaveBeenCalledWith(createNewsDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated news articles', async () => {
      const queryDto: QueryNewsDto = {
        page: 1,
        limit: 10,
      };

      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a single news article', async () => {
      const mockNews = {
        id: '1',
        title: 'Test News',
        content: 'Test content',
      };

      service.findOne.mockResolvedValue(mockNews as any);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockNews);
    });
  });

  describe('findPublished', () => {
    it('should return published news articles', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Published News',
          isPublished: true,
        },
      ];

      service.findPublished.mockResolvedValue(mockNews as any);

      const result = await controller.findPublished();

      expect(service.findPublished).toHaveBeenCalled();
      expect(result).toEqual(mockNews);
    });
  });

  describe('findByCategory', () => {
    it('should return news articles by category', async () => {
      const mockNews = [
        {
          id: '1',
          title: 'Tech News',
          category: 'technology',
        },
      ];

      service.findByCategory.mockResolvedValue(mockNews as any);

      const result = await controller.findByCategory('technology');

      expect(service.findByCategory).toHaveBeenCalledWith('technology');
      expect(result).toEqual(mockNews);
    });
  });

  describe('getCategories', () => {
    it('should return available categories', async () => {
      const mockCategories = ['general', 'technology', 'defi'];

      service.getCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(service.getCategories).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('update', () => {
    it('should update a news article', async () => {
      const updateNewsDto: UpdateNewsDto = {
        title: 'Updated Title',
      };

      const mockUpdatedNews = {
        id: '1',
        title: 'Updated Title',
        content: 'Test content',
      };

      service.update.mockResolvedValue(mockUpdatedNews as any);

      const result = await controller.update('1', updateNewsDto);

      expect(service.update).toHaveBeenCalledWith('1', updateNewsDto);
      expect(result).toEqual(mockUpdatedNews);
    });
  });

  describe('remove', () => {
    it('should remove a news article', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
