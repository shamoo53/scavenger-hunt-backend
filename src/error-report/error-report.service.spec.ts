import { Test, TestingModule } from '@nestjs/testing';
import { ErrorReportService } from './error-report.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ErrorReport } from './entities/error-report.entity';

const mockRepo = {};

describe('ErrorReportService', () => {
  let service: ErrorReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorReportService,
        { provide: getRepositoryToken(ErrorReport), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ErrorReportService>(ErrorReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 