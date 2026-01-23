import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from '../setup/test-app';
import { cleanDatabase, seedTestData, disconnectDatabase } from '../setup/test-db';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await cleanDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await closeTestApp(app);
    await disconnectDatabase();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Test@123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@test.com');

      // Store tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test@123',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'Test@123',
        })
        .expect(400);
    });

    it('should reject missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
        })
        .expect(400);
    });

    it('should login different user roles', async () => {
      // Login as PM
      const pmResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'pm@test.com',
          password: 'Test@123',
        })
        .expect(200);

      expect(pmResponse.body.user.role).toBe('PM');

      // Login as NVKD
      const nvkdResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nvkd@test.com',
          password: 'Test@123',
        })
        .expect(200);

      expect(nvkdResponse.body.user.role).toBe('NVKD');
    });
  });

  describe('POST /auth/client-login', () => {
    it('should login client with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/client-login')
        .send({
          email: 'client@test.com',
          password: 'Test@123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid client credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/client-login')
        .send({
          email: 'client@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Test@123',
        })
        .expect(200);

      const validRefreshToken = loginResponse.body.refreshToken;

      // Use refresh token
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toBeTruthy();
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });

    it('should reject missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out');
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should reject logout with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
