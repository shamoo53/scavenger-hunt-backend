import { Test, TestingModule } from '@nestjs/testing';
import { TriviaService } from './trivia.service';

describe('TriviaService', () => {
  let service: TriviaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriviaService],
    }).compile();

    service = module.get<TriviaService>(TriviaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
