import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, makeApi, prisma, resetDb } from './helpers';

const api = makeApi();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/health', () => {
  it('returns ok when the database is reachable (no token needed)', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });
});

describe('POST /api/auth/register', () => {
  it('creates a USER, returns a token and never returns the password hash', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'רחל ישראלי', email: 'Rachel@Example.com', password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'רחל ישראלי', email: 'rachel@example.com', role: 'USER' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'rachel@example.com' } });
    expect(stored.passwordHash).not.toBe('Password123');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('ignores an attempt to register as ADMIN', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'פורץ', email: 'hacker@example.com', password: 'Password123', role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });

  it('rejects a duplicate email with 409', async () => {
    await createUser({ email: 'taken@example.com' });
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'שם', email: 'TAKEN@example.com', password: 'Password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('validates fields and returns details', async () => {
    const res = await api.post('/api/auth/register').send({ name: 'א', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('requires a password with a letter and a digit', async () => {
    const res = await api.post('/api/auth/register').send({ name: 'שם תקין', email: 'a@example.com', password: '12345678' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await api.post('/api/auth/register').set('Content-Type', 'application/json').send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await createUser({ email: 'sara@example.com', password: 'User1234' });
    const res = await api.post('/api/auth/login').send({ email: 'sara@example.com', password: 'User1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('sara@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password with 401', async () => {
    await createUser({ email: 'sara@example.com', password: 'User1234' });
    const res = await api.post('/api/auth/login').send({ email: 'sara@example.com', password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email with the same 401 message', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'nobody@example.com', password: 'User1234' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await api.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('limits repeated failed attempts with 429', async () => {
    const limitedApi = makeApi(undefined, 3);
    for (let i = 0; i < 3; i += 1) {
      const res = await limitedApi.post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });
      expect(res.status).toBe(401);
    }
    const blocked = await limitedApi.post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});

describe('GET /api/auth/me and token handling', () => {
  it('returns the current user for a valid token', async () => {
    const { user, auth } = await createUser({ name: 'דוד כהן' });
    const res = await api.get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, name: 'דוד כהן', role: 'USER' });
  });

  it('returns 401 without a token', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 401 for a malformed Authorization header', async () => {
    const res = await api.get('/api/auth/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { user } = await createUser();
    const forged = jwt.sign({ role: 'ADMIN' }, 'a-completely-different-secret-value-123456', { subject: String(user.id) });
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const { user } = await createUser();
    const expired = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET as string, {
      subject: String(user.id),
      expiresIn: -10,
    });
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects the "none" algorithm', async () => {
    const { user } = await createUser();
    const unsigned = jwt.sign({ role: 'ADMIN' }, '', { algorithm: 'none', subject: String(user.id) });
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the user of the token was deleted', async () => {
    const { user, auth } = await createUser();
    await prisma.user.delete({ where: { id: user.id } });
    const res = await api.get('/api/auth/me').set(auth);
    expect(res.status).toBe(401);
  });

  it('uses the role from the database, not from the token', async () => {
    const { user } = await createUser({ role: 'USER' });
    // Token תקין שבו כתוב role: ADMIN – אבל במסד הנתונים המשתמש רגיל
    const token = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET as string, { subject: String(user.id) });
    const res = await api.post('/api/categories').set('Authorization', `Bearer ${token}`).send({ name: 'ניסיון' });
    expect(res.status).toBe(403);
  });
});

describe('general', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await api.get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('allows CORS for configured origins only', async () => {
    const allowed = await api.get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const denied = await api.get('/api/health').set('Origin', 'http://evil.example.com');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
