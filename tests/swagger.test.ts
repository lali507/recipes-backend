import SwaggerParser from '@apidevtools/swagger-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { openApiDocument } from '../src/docs/openapi';
import { makeApi, prisma } from './helpers';

const api = makeApi();
afterAll(() => prisma.$disconnect());

// כל ה-Endpoints שמומשו בשרת – כל אחד חייב להופיע ב-Swagger
const IMPLEMENTED_ROUTES = [
  'get /api/health',
  'post /api/auth/register',
  'post /api/auth/login',
  'get /api/auth/me',
  'get /api/categories',
  'post /api/categories',
  'put /api/categories/{id}',
  'delete /api/categories/{id}',
  'get /api/recipes',
  'get /api/recipes/mine',
  'get /api/recipes/authors',
  'get /api/recipes/{id}',
  'post /api/recipes',
  'put /api/recipes/{id}',
  'delete /api/recipes/{id}',
  'post /api/recipes/{id}/image',
  'delete /api/recipes/{id}/image',
  'get /api/favorites',
  'post /api/favorites/{recipeId}',
  'delete /api/favorites/{recipeId}',
];

type Operation = { security?: unknown[]; responses: Record<string, unknown>; summary?: string };
const paths = openApiDocument.paths as unknown as Record<string, Record<string, Operation>>;

function documentedRoutes(): string[] {
  return Object.entries(paths).flatMap(([path, ops]) => Object.keys(ops).map((method) => `${method} ${path}`));
}

describe('OpenAPI / Swagger', () => {
  it('is a valid OpenAPI 3 document', async () => {
    const copy = JSON.parse(JSON.stringify(openApiDocument));
    await expect(SwaggerParser.validate(copy)).resolves.toBeTruthy();
  });

  it('documents exactly the 20 implemented endpoints', () => {
    expect(documentedRoutes().sort()).toEqual([...IMPLEMENTED_ROUTES].sort());
    expect(IMPLEMENTED_ROUTES).toHaveLength(20);
  });

  it('every documented route really exists on the server', async () => {
    for (const route of IMPLEMENTED_ROUTES) {
      const [method, rawPath] = route.split(' ') as [string, string];
      const url = rawPath.replace('{id}', '1').replace('{recipeId}', '1');
      const res = await (api as unknown as Record<string, (u: string) => Promise<{ body: { error?: { code?: string } } }>>)[method]!(url);
      expect(res.body?.error?.code, route).not.toBe('ROUTE_NOT_FOUND');
    }
  });

  it('defines the Bearer JWT security scheme and uses it on every protected route', () => {
    expect(openApiDocument.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    const publicRoutes = ['get /api/health', 'post /api/auth/register', 'post /api/auth/login'];
    for (const [path, ops] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(ops)) {
        const key = `${method} ${path}`;
        expect(op.summary, key).toBeTruthy();
        if (publicRoutes.includes(key)) {
          expect(op.security, key).toBeUndefined();
        } else {
          expect(op.security, key).toEqual([{ bearerAuth: [] }]);
          expect(op.responses, key).toHaveProperty('401');
        }
      }
    }
  });

  it('serves Swagger UI at /api-docs', async () => {
    const res = await api.get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
    const init = await api.get('/api-docs/swagger-ui-init.js');
    expect(init.status).toBe(200);
    expect(init.text).toContain('bearerAuth');
  });

  it('serves the raw spec at /openapi.json', async () => {
    const res = await api.get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('docs/openapi.json is in sync with the code (run "npm run openapi:export" if this fails)', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'openapi.json'), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(openApiDocument)));
  });
});
