import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createRecipe, createUser, makeApi, prisma, resetDb } from './helpers';

const api = makeApi();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('favorites', () => {
  it('requires a token', async () => {
    expect((await api.get('/api/favorites')).status).toBe(401);
    expect((await api.post('/api/favorites/1')).status).toBe(401);
    expect((await api.delete('/api/favorites/1')).status).toBe(401);
  });

  it('adds, lists and removes a favorite; adding twice does not duplicate', async () => {
    const me = await createUser();
    const owner = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: true, title: 'עוגה' });

    const first = await api.post(`/api/favorites/${recipe.id}`).set(me.auth);
    expect(first.status).toBe(201);
    expect(first.body).toEqual({ recipeId: recipe.id, isFavorite: true });

    const again = await api.post(`/api/favorites/${recipe.id}`).set(me.auth);
    expect(again.status).toBe(200);
    expect(await prisma.favorite.count()).toBe(1);

    const list = await api.get('/api/favorites').set(me.auth);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({ id: recipe.id, title: 'עוגה', isFavorite: true });
    expect(list.body.items[0].favoritedAt).toEqual(expect.any(String));
    expect(list.body.pagination.total).toBe(1);

    const detail = await api.get(`/api/recipes/${recipe.id}`).set(me.auth);
    expect(detail.body.isFavorite).toBe(true);

    expect((await api.delete(`/api/favorites/${recipe.id}`).set(me.auth)).status).toBe(204);
    expect((await api.get('/api/favorites').set(me.auth)).body.items).toHaveLength(0);
    // מחיקה חוזרת – עדיין 204
    expect((await api.delete(`/api/favorites/${recipe.id}`).set(me.auth)).status).toBe(204);
  });

  it('favorites are private to each user', async () => {
    const me = await createUser();
    const other = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(other.user.id, category.id);
    await api.post(`/api/favorites/${recipe.id}`).set(me.auth);

    expect((await api.get('/api/favorites').set(other.auth)).body.items).toHaveLength(0);
    // משתמש אחר לא יכול למחוק את המועדף שלי
    await api.delete(`/api/favorites/${recipe.id}`).set(other.auth);
    expect(await prisma.favorite.count({ where: { userId: me.user.id } })).toBe(1);
  });

  it('cannot favorite a private recipe of another user or a missing recipe', async () => {
    const me = await createUser();
    const other = await createUser();
    const category = await createCategory();
    const secret = await createRecipe(other.user.id, category.id, { isPublic: false });
    expect((await api.post(`/api/favorites/${secret.id}`).set(me.auth)).status).toBe(404);
    expect((await api.post('/api/favorites/99999').set(me.auth)).status).toBe(404);
    expect((await api.post('/api/favorites/abc').set(me.auth)).status).toBe(400);
  });

  it('a favorite disappears from the list when its owner makes it private', async () => {
    const me = await createUser();
    const owner = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: true });
    await api.post(`/api/favorites/${recipe.id}`).set(me.auth);

    await prisma.recipe.update({ where: { id: recipe.id }, data: { isPublic: false } });
    const list = await api.get('/api/favorites').set(me.auth);
    expect(list.body.items).toHaveLength(0);
    expect(list.body.pagination.total).toBe(0);
  });

  it('deleting a recipe removes it from favorites', async () => {
    const me = await createUser();
    const owner = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id);
    await api.post(`/api/favorites/${recipe.id}`).set(me.auth);
    await api.delete(`/api/recipes/${recipe.id}`).set(owner.auth);
    expect(await prisma.favorite.count()).toBe(0);
  });
});
