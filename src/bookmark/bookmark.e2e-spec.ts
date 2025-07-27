import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { BookmarkModule } from '../src/bookmark/bookmark.module';
import { Bookmark, BookmarkType } from '../src/bookmark/entities/bookmark.entity';

describe('BookmarkController (e2e)', () => {
  let app: INestApplication;
  let createdBookmarkId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Bookmark],
          synchronize: true,
        }),
        BookmarkModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bookmarks (POST)', () => {
    it('should create a new bookmark', () => {
      const createBookmarkDto = {
        playerId: '123e4567-e89b-12d3-a456-426614174001',
        itemId: '123e4567-e89b-12d3-a456-426614174002',
        type: BookmarkType.PUZZLE,
        title: 'Test Puzzle',
        description: 'A test puzzle for e2e testing',
      };

      return request(app.getHttpServer())
        .post('/bookmarks')
        .send(createBookmarkDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.playerId).toBe(createBookmarkDto.playerId);
          expect(response.body.itemId).toBe(createBookmarkDto.itemId);
          expect(response.body.type).toBe(createBookmarkDto.type);
          expect(response.body.title).toBe(createBookmarkDto.title);
          createdBookmarkId = response.body.id;
        });
    });

    it('should return 409 when creating duplicate bookmark', () => {
      const createBookmarkDto = {
        playerId: '123e4567-e89b-12d3-a456-426614174001',
        itemId: '123e4567-e89b-12d3-a456-426614174002',
        type: BookmarkType.PUZZLE,
        title: 'Duplicate Test',
      };

      return request(app.getHttpServer())
        .post('/bookmarks')
        .send(createBookmarkDto)
        .expect(409);
    });

    it('should return 400 for invalid data', () => {
      const invalidDto = {
        playerId: 'invalid-uuid',
        itemId: '123e4567-e89b-12d3-a456-426614174002',
        type: 'INVALID_TYPE',
      };

      return request(app.getHttpServer())
        .post('/bookmarks')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/bookmarks (GET)', () => {
    it('should return paginated bookmarks', () => {
      return request(app.getHttpServer())
        .get('/bookmarks')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('bookmarks');
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('limit');
          expect(response.body).toHaveProperty('offset');
          expect(Array.isArray(response.body.bookmarks)).toBe(true);
        });
    });

    it('should filter bookmarks by playerId', () => {
      return request(app.getHttpServer())
        .get('/bookmarks?playerId=123e4567-e89b-12d3-a456-426614174001')
        .expect(200)
        .then((response) => {
          expect(response.body.bookmarks.length).toBeGreaterThan(0);
          response.body.bookmarks.forEach((bookmark) => {
            expect(bookmark.playerId).toBe('123e4567-e89b-12d3-a456-426614174001');
          });
        });
    });

    it('should search bookmarks by title', () => {
      return request(app.getHttpServer())
        .get('/bookmarks?search=Test')
        .expect(200)
        .then((response) => {
          expect(response.body.bookmarks.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/bookmarks/:id (GET)', () => {
    it('should return a bookmark by ID', () => {
      return request(app.getHttpServer())
        .get(`/bookmarks/${createdBookmarkId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(createdBookmarkId);
          expect(response.body).toHaveProperty('playerId');
          expect(response.body).toHaveProperty('itemId');
          expect(response.body).toHaveProperty('type');
        });
    });

    it('should return 404 for non-existent bookmark', () => {
      return request(app.getHttpServer())
        .get('/bookmarks/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/bookmarks/invalid-uuid')
        .expect(400);
    });
  });

  describe('/bookmarks/player/:playerId/stats (GET)', () => {
    it('should return player bookmark statistics', () => {
      return request(app.getHttpServer())
        .get('/bookmarks/player/123e4567-e89b-12d3-a456-426614174001/stats')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('totalCount');
          expect(response.body).toHaveProperty('countByType');
          expect(typeof response.body.totalCount).toBe('number');
          expect(typeof response.body.countByType).toBe('object');
        });
    });
  });

  describe('/bookmarks/check/:playerId/:itemId/:type (GET)', () => {
    it('should check if bookmark exists', () => {
      return request(app.getHttpServer())
        .get('/bookmarks/check/123e4567-e89b-12d3-a456-426614174001/123e4567-e89b-12d3-a456-426614174002/puzzle')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('bookmarked');
          expect(response.body.bookmarked).toBe(true);
          expect(response.body).toHaveProperty('bookmark');
        });
    });

    it('should return false for non-existent bookmark', () => {
      return request(app.getHttpServer())
        .get('/bookmarks/check/123e4567-e89b-12d3-a456-426614174999/123e4567-e89b-12d3-a456-426614174999/puzzle')
        .expect(200)
        .then((response) => {
          expect(response.body.bookmarked).toBe(false);
          expect(response.body.bookmark).toBeUndefined();
        });
    });
  });

  describe('/bookmarks/:id (PATCH)', () => {
    it('should update a bookmark', () => {
      const updateDto = {
        title: 'Updated Test Puzzle',
        description: 'Updated description',
      };

      return request(app.getHttpServer())
        .patch(`/bookmarks/${createdBookmarkId}`)
        .send(updateDto)
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe(updateDto.title);
          expect(response.body.description).toBe(updateDto.description);
        });
    });

    it('should return 404 for non-existent bookmark', () => {
      return request(app.getHttpServer())
        .patch('/bookmarks/123e4567-e89b-12d3-a456-426614174999')
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('/bookmarks/player/:playerId/item/:itemId/type/:type (DELETE)', () => {
    it('should remove bookmark by player and item', () => {
      return request(app.getHttpServer())
        .delete('/bookmarks/player/123e4567-e89b-12d3-a456-426614174001/item/123e4567-e89b-12d3-a456-426614174002/type/puzzle')
        .expect(204);
    });
  });

  describe('/bookmarks/:id (DELETE)', () => {
    it('should create a new bookmark for deletion test', async () => {
      const createBookmarkDto = {
        playerId: '123e4567-e89b-12d3-a456-426614174003',
        itemId: '123e4567-e89b-12d3-a456-426614174004',
        type: BookmarkType.RESOURCE,
        title: 'Resource to Delete',
      };

      const response = await request(app.getHttpServer())
        .post('/bookmarks')
        .send(createBookmarkDto)
        .expect(201);

      const bookmarkId = response.body.id;

      return request(app.getHttpServer())
        .delete(`/bookmarks/${bookmarkId}`)
        .expect(204);
    });

    it('should return 404 for non-existent bookmark', () => {
      return request(app.getHttpServer())
        .delete('/bookmarks/123e4567-e89b-12d3-a456-426614174999')
        .expect(404);
    });
  });
});
