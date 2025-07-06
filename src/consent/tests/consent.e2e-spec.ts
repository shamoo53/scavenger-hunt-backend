import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
// import { Consent, ConsentType } from '../src/consent/entities/consent.entity';
import { AppModule } from 'src/app.module';
import { User } from 'src/user/entities/user.entity';
import { Consent, ConsentType } from '../entities/consent.entity';

describe('ConsentController (e2e)', () => {
  let app: INestApplication;
  let consentRepository: Repository<Consent>;
  let userRepository: Repository<User>;
  let regularUserToken: string;
  let adminToken: string;
  let regularUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    consentRepository = moduleFixture.get<Repository<Consent>>(getRepositoryToken(Consent));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    const jwtService = moduleFixture.get<JwtService>(JwtService);

    await consentRepository.query('DELETE FROM consents;');
    await userRepository.query('DELETE FROM users;');

    const user = await userRepository.save({ email: 'consentuser@test.com', password_hash: 'hash', role: UserRole.USER });
    const admin = await userRepository.save({ email: 'consentadmin@test.com', password_hash: 'hash', role: UserRole.ADMIN });
    regularUserId = user.id;

    regularUserToken = jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    adminToken = jwtService.sign({ sub: admin.id, email: admin.email, role: admin.role });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/consent (POST) -> should allow a user to give consent', () => {
    return request(app.getHttpServer())
      .post('/consent')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ consentType: ConsentType.TERMS_OF_SERVICE })
      .expect(201)
      .then((res) => {
        expect(res.body.userId).toBe(regularUserId);
        expect(res.body.consentType).toBe(ConsentType.TERMS_OF_SERVICE);
      });
  });

  it('/consent (POST) -> should prevent giving duplicate consent', () => {
    return request(app.getHttpServer())
      .post('/consent')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ consentType: ConsentType.TERMS_OF_SERVICE })
      .expect(409); 
  });

  it('/consent/me (GET) -> should fetch the current user\'s consent history', async () => {
    await request(app.getHttpServer())
      .post('/consent')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ consentType: ConsentType.PRIVACY_POLICY });

    return request(app.getHttpServer())
      .get('/consent/me')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(2);
      });
  });

  it('/consent/user/:userId (GET) -> should not allow a regular user to fetch another user\'s history', () => {
    return request(app.getHttpServer())
      .get(`/consent/user/${regularUserId}`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(403); 
  });

  it('/consent/user/:userId (GET) -> should allow an admin to fetch a user\'s history', () => {
    return request(app.getHttpServer())
      .get(`/consent/user/${regularUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(2);
      });
  });
});