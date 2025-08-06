// src/puzzle-difficulty-stats/test/puzzle-difficulty-stats.controller.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module'; // Adjust this path to your root AppModule
import { PuzzleDifficultyStatsModule } from '../puzzle-difficulty-stats.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PuzzleDifficultyStat } from '../entities/puzzle-difficulty-stat.entity';
import { Repository } from 'typeorm';

describe('PuzzleDifficultyStatsController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<PuzzleDifficultyStat>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PuzzleDifficultyStatsModule], // Assuming AppModule sets up TypeOrm.forRoot
    })
      // If you are using a real DB, you might want to override the provider
      // to connect to a test database. For this example, we'll assume
      // an in-memory DB is configured in your test environment.
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    repository = moduleFixture.get<Repository<PuzzleDifficultyStat>>(
      getRepositoryToken(PuzzleDifficultyStat),
    );
    // Clean up the table before tests
    await repository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/puzzle-difficulty-stats/increment/:difficultyLevel (POST)', () => {
    return request(app.getHttpServer())
      .post('/puzzle-difficulty-stats/increment/easy')
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            difficultyLevel: 'easy',
            solveCount: 1,
          }),
        );
      });
  });

  it('/puzzle-difficulty-stats/:difficultyLevel (GET)', async () => {
    // First, increment again to have a known state
    await request(app.getHttpServer())
      .post('/puzzle-difficulty-stats/increment/easy')
      .expect(200);

    return request(app.getHttpServer())
      .get('/puzzle-difficulty-stats/easy')
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            difficultyLevel: 'easy',
            solveCount: 2,
          }),
        );
      });
  });

  it('/puzzle-difficulty-stats (GET)', async () => {
    // Create another stat for a different level
    await request(app.getHttpServer())
      .post('/puzzle-difficulty-stats/increment/hard')
      .expect(200);

    return request(app.getHttpServer())
      .get('/puzzle-difficulty-stats')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(2);
        const easyStat = res.body.find((s) => s.difficultyLevel === 'easy');
        const hardStat = res.body.find((s) => s.difficultyLevel === 'hard');
        expect(easyStat.solveCount).toBe(2);
        expect(hardStat.solveCount).toBe(1);
      });
  });

  it('should return 404 for a non-existent difficulty level', () => {
    return request(app.getHttpServer())
      .get('/puzzle-difficulty-stats/nonexistent')
      .expect(404);
  });
});