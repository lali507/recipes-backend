import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createRecipe, createUser, makeApi, prisma, resetDb } from './helpers';

const api = makeApi();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/categories', () => {
  it('requires a token', async () => {
    expect((await api.get('/api/categories')).status).toBe(401);
  });

  it('lists categories sorted by name with visible recipe counts', async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const cakes = await createCategory('עוגות');
    await createCategory('סלטים');
    await createRecipe(owner.user.id, cakes.id, { isPublic: true });
    await createRecipe(owner.user.id, cakes.id, { isPublic: false });

    const res = await api.get('/api/categories').set(viewer.auth);
    expect(res.status).toBe(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['סלטים', 'עוגות']);
    const cakesRow = res.body.find((c: { name: string }) => c.name === 'עוגות');
    // הצופה לא רואה את המתכון הפרטי, וגם לא מקבל את המספר הכולל
    expect(cakesRow.recipeCount).toBe(1);
    expect(cakesRow).not.toHaveProperty('totalRecipeCount');

    const ownerRes = await api.get('/api/categories').set(owner.auth);
    expect(ownerRes.body.find((c: { name: string }) => c.name === 'עוגות').recipeCount).toBe(2);
  });

  it('gives the admin the total count including private recipes', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const cakes = await createCategory('עוגות');
    await createRecipe(owner.user.id, cakes.id, { isPublic: false });
    const res = await api.get('/api/categories').set(admin.auth);
    expect(res.body[0]).toMatchObject({ name: 'עוגות', recipeCount: 0, totalRecipeCount: 1 });
  });
});

describe('admin category management', () => {
  it('admin can create, rename and delete a category', async () => {
    const admin = await createUser({ role: 'ADMIN' });

    const created = await api.post('/api/categories').set(admin.auth).send({ name: '  פשטידות  ' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'פשטידות', recipeCount: 0 });

    const renamed = await api.put(`/api/categories/${created.body.id}`).set(admin.auth).send({ name: 'פשטידות וקישים' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe('פשטידות וקישים');

    const deleted = await api.delete(`/api/categories/${created.body.id}`).set(admin.auth);
    expect(deleted.status).toBe(204);
    expect(await prisma.category.count()).toBe(0);
  });

  it('regular users get 403 on create, update and delete', async () => {
    const user = await createUser();
    const category = await createCategory('עוגות');
    expect((await api.post('/api/categories').set(user.auth).send({ name: 'חדשה' })).status).toBe(403);
    expect((await api.put(`/api/categories/${category.id}`).set(user.auth).send({ name: 'שונה' })).status).toBe(403);
    expect((await api.delete(`/api/categories/${category.id}`).set(user.auth)).status).toBe(403);
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull();
  });

  it('rejects duplicate names (case-insensitive) with 409', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    await createCategory('Cakes');
    const res = await api.post('/api/categories').set(admin.auth).send({ name: 'cakes' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NAME_TAKEN');
  });

  it('allows renaming a category to its own name', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory('עוגות');
    const res = await api.put(`/api/categories/${category.id}`).set(admin.auth).send({ name: 'עוגות' });
    expect(res.status).toBe(200);
  });

  it('refuses to delete a category that has recipes (409)', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const owner = await createUser();
    const category = await createCategory('עוגות');
    await createRecipe(owner.user.id, category.id, { isPublic: false });
    const res = await api.delete(`/api/categories/${category.id}`).set(admin.auth);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_IN_USE');
  });

  it('validates the name and the id', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    expect((await api.post('/api/categories').set(admin.auth).send({ name: 'א' })).status).toBe(400);
    expect((await api.post('/api/categories').set(admin.auth).send({})).status).toBe(400);
    expect((await api.put('/api/categories/abc').set(admin.auth).send({ name: 'תקין' })).status).toBe(400);
    expect((await api.delete('/api/categories/999').set(admin.auth)).status).toBe(404);
  });
});
