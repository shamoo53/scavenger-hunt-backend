// src/starknet-quiz/test/starknet-quiz.controller.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module'; // Adjust path to your root AppModule
import { StarknetQuizModule } from '../starknet-quiz.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StarknetQuiz } from '../entities/starknet-quiz.entity';
import { Repository } from 'typeorm';

describe('StarknetQuizController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<StarknetQuiz>;
  let quizId: string;

  const quizDto = {
    question: 'What language is used for StarkNet contracts?',
    options: ['Solidity', 'Rust', 'Cairo'],
    correctAnswer: 'Cairo',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, StarknetQuizModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    repository = moduleFixture.get<Repository<StarknetQuiz>>(
      getRepositoryToken(StarknetQuiz),
    );
    await repository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/starknet-quiz (POST) - should create a quiz', () => {
    return request(app.getHttpServer())
      .post('/starknet-quiz')
      .send(quizDto)
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            question: quizDto.question,
            options: quizDto.options,
            correctAnswer: quizDto.correctAnswer,
          }),
        );
        quizId = res.body.id; // Save ID for later tests
      });
  });

  it('/starknet-quiz (POST) - should fail if correctAnswer is not in options', () => {
    return request(app.getHttpServer())
      .post('/starknet-quiz')
      .send({ ...quizDto, correctAnswer: 'Go' })
      .expect(400);
  });

  it('/starknet-quiz (GET) - should get all quizzes', () => {
    return request(app.getHttpServer())
      .get('/starknet-quiz')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(1);
        expect(res.body[0].question).toBe(quizDto.question);
      });
  });

  it('/starknet-quiz/:id (GET) - should get one quiz by id', () => {
    return request(app.getHttpServer())
      .get(`/starknet-quiz/${quizId}`)
      .expect(200)
      .then((res) => {
        expect(res.body.id).toBe(quizId);
        expect(res.body.question).toBe(quizDto.question);
      });
  });

  it('/starknet-quiz/:id (PATCH) - should update a quiz', () => {
    const updatedQuestion = 'What is the primary language for StarkNet?';
    return request(app.getHttpServer())
      .patch(`/starknet-quiz/${quizId}`)
      .send({ question: updatedQuestion })
      .expect(200)
      .then((res) => {
        expect(res.body.question).toBe(updatedQuestion);
      });
  });

  it('/starknet-quiz/:id (DELETE) - should delete a quiz', () => {
    return request(app.getHttpServer())
      .delete(`/starknet-quiz/${quizId}`)
      .expect(200);
  });

  it('/starknet-quiz/:id (GET) - should return 404 after deletion', () => {
    return request(app.getHttpServer())
      .get(`/starknet-quiz/${quizId}`)
      .expect(404);
  });
});