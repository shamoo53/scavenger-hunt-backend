import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleUnlockService } from './puzzle-unlock.service';

describe('PuzzleUnlockService', () => {
  let service: PuzzleUnlockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PuzzleUnlockService],
    }).compile();

    service = module.get<PuzzleUnlockService>(PuzzleUnlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
