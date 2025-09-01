// import { Test, TestingModule } from '@nestjs/testing';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { NotFoundException } from '@nestjs/common';
// import { StarknetNewsService } from './starknet-news.service';
// import { StarknetNews } from './entities/news.entity';
// import { CreateNewsDto } from './dto/create-news.dto';
// import { UpdateNewsDto } from './dto/update-news.dto';
// import { QueryNewsDto } from './dto/query-news.dto';

// const mockNewsRepository = () => ({
//   create: jest.fn(),
//   save: jest.fn(),
//   find: jest.fn(),
//   findOne: jest.fn(),
//   preload: jest.fn(),
//   remove: jest.fn(),
//   createQueryBuilder: jest.fn(() => ({
//     select: jest.fn().mockReturnThis(),
//     where: jest.fn().mockReturnThis(),
//     andWhere: jest.fn().mockReturnThis(),
//     orderBy: jest.fn().mockReturnThis(),
//     skip: jest.fn().mockReturnThis(),
//     take: jest.fn().mockReturnThis(),
//     getManyAndCount: jest.fn(),
//     getRawMany: jest.fn(),
//   })),
// });

// type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// describe('StarknetNewsService', () => {
//   let service: StarknetNewsService;
//   let repository: MockRepository<StarknetNews>;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         StarknetNewsService,
//         {
//           provide: getRepositoryToken(StarknetNews),
//           useFactory: mockNewsRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<StarknetNewsService>(StarknetNewsService);
//     repository = module.get<MockRepository<StarknetNews>>(
//       getRepositoryToken(StarknetNews),
//     );
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('create', () => {
//     it('should successfully create a news article', async () => {
//       const createNewsDto: CreateNewsDto = {
//         title: 'Test News',
//         content: 'Test content',
//         category: 'general',
//         isPublished: true,
//       };

//       const mockNews = {
//         id: '1',
//         ...createNewsDto,
//         publishedAt: new Date(),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       repository.create.mockReturnValue(mockNews);
//       repository.save.mockResolvedValue(mockNews);

//       const result = await service.create(createNewsDto);

//       expect(repository.create).toHaveBeenCalledWith({
//         ...createNewsDto,
//         publishedAt: expect.any(Date),
//       });
//       expect(repository.save).toHaveBeenCalledWith(mockNews);
//       expect(result).toEqual(mockNews);
//     });
//   });

//   describe('findOne', () => {
//     it('should return a news article if found', async () => {
//       const mockNews = {
//         id: '1',
//         title: 'Test News',
//         content: 'Test content',
//       };

//       repository.findOne.mockResolvedValue(mockNews);

//       const result = await service.findOne('1');

//       expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
//       expect(result).toEqual(mockNews);
//     });

//     it('should throw NotFoundException if news article not found', async () => {
//       repository.findOne.mockResolvedValue(null);

//       await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('findPublished', () => {
//     it('should return published news articles', async () => {
//       const mockNews = [
//         {
//           id: '1',
//           title: 'Published News',
//           content: 'Content',
//           isPublished: true,
//         },
//       ];

//       repository.find.mockResolvedValue(mockNews);

//       const result = await service.findPublished();

//       expect(repository.find).toHaveBeenCalledWith({
//         where: { isPublished: true },
//         order: { publishedAt: 'DESC' },
//       });
//       expect(result).toEqual(mockNews);
//     });
//   });

//   describe('update', () => {
//     it('should successfully update a news article', async () => {
//       const updateNewsDto: UpdateNewsDto = {
//         title: 'Updated News',
//       };

//       const existingNews = {
//         id: '1',
//         title: 'Test News',
//         content: 'Test content',
//         isPublished: false,
//       };

//       const updatedNews = {
//         ...existingNews,
//         ...updateNewsDto,
//       };

//       repository.findOne.mockResolvedValue(existingNews);
//       repository.preload.mockResolvedValue(updatedNews);
//       repository.save.mockResolvedValue(updatedNews);

//       const result = await service.update('1', updateNewsDto);

//       expect(repository.preload).toHaveBeenCalledWith({
//         id: '1',
//         ...updateNewsDto,
//       });
//       expect(repository.save).toHaveBeenCalledWith(updatedNews);
//       expect(result).toEqual(updatedNews);
//     });

//     it('should throw NotFoundException if news article not found', async () => {
//       repository.findOne.mockResolvedValue(null);

//       await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('remove', () => {
//     it('should successfully remove a news article', async () => {
//       const mockNews = {
//         id: '1',
//         title: 'Test News',
//         content: 'Test content',
//       };

//       repository.findOne.mockResolvedValue(mockNews);
//       repository.remove.mockResolvedValue(mockNews);

//       await service.remove('1');

//       expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
//       expect(repository.remove).toHaveBeenCalledWith(mockNews);
//     });
//   });
// });
