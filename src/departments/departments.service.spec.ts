// src/departments/departments.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('DepartmentsModule (e2e)', () => {
  let app: INestApplication;
  let createdId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it('/POST departments', async () => {
    const res = await request(app.getHttpServer())
      .post('/departments')
      .send({ name: 'IT Department', description: 'Handles tech stuff' })
      .expect(201);
    createdId = res.body.id;
  });

  it('/GET departments', () => {
    return request(app.getHttpServer()).get('/departments').expect(200);
  });

  it('/PATCH departments/:id', () => {
    return request(app.getHttpServer())
      .patch(`/departments/${createdId}`)
      .send({ headOfDepartment: 'John Doe' })
      .expect(200);
  });

  it('/DELETE departments/:id', () => {
    return request(app.getHttpServer())
      .delete(`/departments/${createdId}`)
      .expect(204);
  });

  afterAll(async () => {
    await app.close();
  });
});
