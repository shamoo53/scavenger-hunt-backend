import { Test, TestingModule } from '@nestjs/testing';
import { DraftReviewService } from './draft-review.service';

describe('DraftReviewService', () => {
  let service: DraftReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DraftReviewService],
    }).compile();

    service = module.get<DraftReviewService>(DraftReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
