import { Test, TestingModule } from '@nestjs/testing';
import { DraftReviewController } from './draft-review.controller';

describe('DraftReviewController', () => {
  let controller: DraftReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftReviewController],
    }).compile();

    controller = module.get<DraftReviewController>(DraftReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
