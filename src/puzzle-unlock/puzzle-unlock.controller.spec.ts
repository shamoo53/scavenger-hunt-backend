import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleUnlockController } from './puzzle-unlock.controller';
import { PuzzleUnlockService } from './puzzle-unlock.service';

describe('PuzzleUnlockController', () => {
  let controller: PuzzleUnlockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzleUnlockController],
      providers: [PuzzleUnlockService],
    }).compile();

    controller = module.get<PuzzleUnlockController>(PuzzleUnlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
