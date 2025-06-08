import { Test, TestingModule } from '@nestjs/testing';
import { AbuseDetectionService } from './abuse-detection.service';

describe('AbuseDetectionService', () => {
  let service: AbuseDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbuseDetectionService],
    }).compile();

    service = module.get<AbuseDetectionService>(AbuseDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
