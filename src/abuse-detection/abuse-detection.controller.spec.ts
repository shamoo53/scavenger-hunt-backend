import { Test, TestingModule } from '@nestjs/testing';
import { AbuseDetectionController } from './abuse-detection.controller';
import { AbuseDetectionService } from './abuse-detection.service';

describe('AbuseDetectionController', () => {
  let controller: AbuseDetectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbuseDetectionController],
      providers: [AbuseDetectionService],
    }).compile();

    controller = module.get<AbuseDetectionController>(AbuseDetectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
