import { PuzzleService } from "src/bookmark/services/puzzle.service";
import { Repository } from "typeorm";
import { Puzzle } from "./puzzle.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('PuzzleService', () => {
    let service: PuzzleService;
    let repo: Repository<Puzzle>;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PuzzleService,
          {
            provide: getRepositoryToken(Puzzle),
            useValue: {
              create: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
              find: jest.fn(),
            },
          },
        ],
      }).compile();
  
      service = module.get<PuzzleService>(PuzzleService);
      repo = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
    });
  
    it('should create a puzzle', async () => {
      const dto = { title: 'Test', description: '...', data: {} };
      jest.spyOn(repo, 'save').mockResolvedValue({ id: 1, ...dto });
      const result = await service.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  
    it('should update a puzzle', async () => {
      const dto = { title: 'Updated' };
      jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 });
      const result = await service.update(1, dto);
      expect(result).toEqual({ affected: 1 });
    });
  });