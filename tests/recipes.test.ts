import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createRecipe, createUser, makeApi, prisma, resetDb, validRecipeBody } from './helpers';

const api = makeApi();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

type RecipeItem = { id: number; title: string; isPublic: boolean; prepTimeMinutes: number };
const titles = (body: { items: RecipeItem[] }) => body.items.map((r) => r.title);

describe('authentication on recipe routes', () => {
  it('every recipe route requires a token', async () => {
    const calls = [
      api.get('/api/recipes'),
      api.get('/api/recipes/mine'),
      api.get('/api/recipes/1'),
      api.post('/api/recipes').send({}),
      api.put('/api/recipes/1').send({}),
      api.delete('/api/recipes/1'),
      api.post('/api/recipes/1/image'),
      api.delete('/api/recipes/1/image'),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
    }
  });
});

describe('CRUD', () => {
  it('creates a recipe owned by the token user (ignores authorId from the client)', async () => {
    const me = await createUser();
    const other = await createUser();
    const category = await createCategory('עוגות');

    const res = await api
      .post('/api/recipes')
      .set(me.auth)
      .send({ ...validRecipeBody(category.id), authorId: other.user.id });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'עוגת שמרים',
      isPublic: true,
      imageUrl: null,
      category: { id: category.id, name: 'עוגות' },
      author: { id: me.user.id },
      isOwner: true,
      canEdit: true,
      canDelete: true,
      isFavorite: false,
    });
    expect(res.body).not.toHaveProperty('imagePublicId');
    expect(res.body).not.toHaveProperty('authorId');
    expect(res.body.author).not.toHaveProperty('email');

    const stored = await prisma.recipe.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored.authorId).toBe(me.user.id);
  });

  it('defaults isPublic to false on create and accepts numeric strings', async () => {
    const me = await createUser();
    const category = await createCategory();
    const body = validRecipeBody(category.id, { prepTimeMinutes: '45', servings: '6' });
    delete (body as Record<string, unknown>).isPublic;
    const res = await api.post('/api/recipes').set(me.auth).send(body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ isPublic: false, prepTimeMinutes: 45, servings: 6 });
  });

  it('reads, updates and deletes my recipe', async () => {
    const me = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(me.user.id, category.id, { isPublic: false });

    const read = await api.get(`/api/recipes/${recipe.id}`).set(me.auth);
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(recipe.id);

    const updated = await api
      .put(`/api/recipes/${recipe.id}`)
      .set(me.auth)
      .send(validRecipeBody(category.id, { title: 'שם חדש', isPublic: true }));
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'שם חדש', isPublic: true });

    const deleted = await api.delete(`/api/recipes/${recipe.id}`).set(me.auth);
    expect(deleted.status).toBe(204);
    expect(await prisma.recipe.findUnique({ where: { id: recipe.id } })).toBeNull();
    expect((await api.get(`/api/recipes/${recipe.id}`).set(me.auth)).status).toBe(404);
  });

  it('PUT requires isPublic', async () => {
    const me = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(me.user.id, category.id);
    const body = validRecipeBody(category.id);
    delete (body as Record<string, unknown>).isPublic;
    const res = await api.put(`/api/recipes/${recipe.id}`).set(me.auth).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain('isPublic');
  });
});

describe('validation', () => {
  it('returns field-level errors', async () => {
    const me = await createUser();
    const category = await createCategory();
    const res = await api
      .post('/api/recipes')
      .set(me.auth)
      .send(
        validRecipeBody(category.id, {
          title: 'א',
          prepTimeMinutes: 0,
          servings: 1000,
          difficulty: 'VERY_HARD',
          kosherType: 'X',
          isPublic: 'yes',
        }),
      );
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['title', 'prepTimeMinutes', 'servings', 'difficulty', 'kosherType', 'isPublic']),
    );
  });

  it('rejects missing required fields and whitespace-only text', async () => {
    const me = await createUser();
    const category = await createCategory();
    const res = await api
      .post('/api/recipes')
      .set(me.auth)
      .send({ title: 'שם', ingredients: '   ', categoryId: category.id });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['description', 'ingredients', 'instructions']));
  });

  it('rejects a category that does not exist', async () => {
    const me = await createUser();
    const res = await api.post('/api/recipes').set(me.auth).send(validRecipeBody(9999));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('categoryId');
  });

  it('rejects an invalid id in the URL', async () => {
    const me = await createUser();
    expect((await api.get('/api/recipes/abc').set(me.auth)).status).toBe(400);
    expect((await api.get('/api/recipes/-5').set(me.auth)).status).toBe(400);
    expect((await api.get('/api/recipes/1.5').set(me.auth)).status).toBe(400);
  });

  it('rejects invalid query parameters', async () => {
    const me = await createUser();
    expect((await api.get('/api/recipes?sort=random').set(me.auth)).status).toBe(400);
    expect((await api.get('/api/recipes?limit=500').set(me.auth)).status).toBe(400);
    expect((await api.get('/api/recipes?difficulty=easy').set(me.auth)).status).toBe(400);
    expect((await api.get('/api/recipes?search=a&search=b').set(me.auth)).status).toBe(400);
  });
});

describe('privacy and permissions', () => {
  it('another user cannot see, edit or delete my private recipe (404, not 403)', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const category = await createCategory();
    const secret = await createRecipe(owner.user.id, category.id, { isPublic: false });

    expect((await api.get(`/api/recipes/${secret.id}`).set(stranger.auth)).status).toBe(404);
    expect(
      (await api.put(`/api/recipes/${secret.id}`).set(stranger.auth).send(validRecipeBody(category.id))).status,
    ).toBe(404);
    expect((await api.delete(`/api/recipes/${secret.id}`).set(stranger.auth)).status).toBe(404);
    expect(await prisma.recipe.findUnique({ where: { id: secret.id } })).not.toBeNull();
  });

  it('another user can view my public recipe but cannot edit or delete it (403)', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: true, title: 'מקורי' });

    const read = await api.get(`/api/recipes/${recipe.id}`).set(stranger.auth);
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({ isOwner: false, canEdit: false, canDelete: false });

    const put = await api
      .put(`/api/recipes/${recipe.id}`)
      .set(stranger.auth)
      .send(validRecipeBody(category.id, { title: 'נפרץ' }));
    expect(put.status).toBe(403);
    expect((await api.delete(`/api/recipes/${recipe.id}`).set(stranger.auth)).status).toBe(403);
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).title).toBe('מקורי');
  });

  it('admin can delete a public recipe of another user', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: true });

    const read = await api.get(`/api/recipes/${recipe.id}`).set(admin.auth);
    expect(read.body).toMatchObject({ canEdit: false, canDelete: true });
    expect((await api.delete(`/api/recipes/${recipe.id}`).set(admin.auth)).status).toBe(204);
  });

  it('admin can neither see nor delete a private recipe of another user', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: false });

    expect((await api.get(`/api/recipes/${recipe.id}`).set(admin.auth)).status).toBe(404);
    expect((await api.delete(`/api/recipes/${recipe.id}`).set(admin.auth)).status).toBe(404);
    const list = await api.get('/api/recipes').set(admin.auth);
    expect(list.body.items).toHaveLength(0);
  });

  it('admin cannot edit a public recipe of another user', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const recipe = await createRecipe(owner.user.id, category.id, { isPublic: true });
    const res = await api.put(`/api/recipes/${recipe.id}`).set(admin.auth).send(validRecipeBody(category.id));
    expect(res.status).toBe(403);
  });
});

describe('lists, search, filter, sort and pagination', () => {
  async function seedList() {
    const me = await createUser();
    const other = await createUser();
    const cakes = await createCategory('עוגות');
    const salads = await createCategory('סלטים');
    const base = Date.now();
    const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000);

    await createRecipe(other.user.id, cakes.id, {
      title: 'עוגת שוקולד',
      prepTimeMinutes: 50,
      difficulty: 'EASY',
      kosherType: 'PAREVE',
      createdAt: at(40),
    });
    await createRecipe(other.user.id, cakes.id, {
      title: 'עוגת גבינה',
      prepTimeMinutes: 90,
      difficulty: 'HARD',
      kosherType: 'DAIRY',
      createdAt: at(30),
    });
    await createRecipe(me.user.id, salads.id, {
      title: 'סלט ירקות',
      description: 'סלט טרי',
      ingredients: 'עגבניות\nמלפפונים\nשוקולד מגורר (רק לבדיקה)',
      prepTimeMinutes: 15,
      difficulty: 'EASY',
      kosherType: 'PAREVE',
      createdAt: at(20),
    });
    await createRecipe(other.user.id, cakes.id, {
      title: 'מוס שוקולד סודי',
      isPublic: false,
      prepTimeMinutes: 20,
      createdAt: at(10),
    });
    await createRecipe(me.user.id, cakes.id, {
      title: 'אפונה פרטית שלי',
      isPublic: false,
      prepTimeMinutes: 10,
      createdAt: at(5),
    });
    return { me, other, cakes, salads };
  }

  it('public list shows only public recipes, newest first by default', async () => {
    const { me } = await seedList();
    const res = await api.get('/api/recipes').set(me.auth);
    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(['סלט ירקות', 'עוגת גבינה', 'עוגת שוקולד']);
    expect(res.body.pagination).toEqual({ page: 1, limit: 12, total: 3, totalPages: 1 });
  });

  it('search looks in title, description and ingredients, and never returns private recipes of others', async () => {
    const { me } = await seedList();
    const res = await api.get(`/api/recipes?search=${encodeURIComponent('שוקולד')}`).set(me.auth);
    expect(titles(res.body).sort()).toEqual(['סלט ירקות', 'עוגת שוקולד'].sort());
  });

  it('search is case-insensitive', async () => {
    const me = await createUser();
    const category = await createCategory();
    await createRecipe(me.user.id, category.id, { title: 'Chocolate Cake' });
    const res = await api.get('/api/recipes?search=CHOCOLATE').set(me.auth);
    expect(titles(res.body)).toEqual(['Chocolate Cake']);
  });

  it('filters can be combined', async () => {
    const { me, cakes } = await seedList();
    const byCategory = await api.get(`/api/recipes?categoryId=${cakes.id}`).set(me.auth);
    expect(titles(byCategory.body)).toEqual(['עוגת גבינה', 'עוגת שוקולד']);

    const combined = await api
      .get(`/api/recipes?categoryId=${cakes.id}&kosherType=PAREVE&difficulty=EASY`)
      .set(me.auth);
    expect(titles(combined.body)).toEqual(['עוגת שוקולד']);

    const quick = await api.get('/api/recipes?maxPrepTime=50').set(me.auth);
    expect(titles(quick.body)).toEqual(['סלט ירקות', 'עוגת שוקולד']);
  });

  it('supports every sort option', async () => {
    const { me } = await seedList();
    const oldest = await api.get('/api/recipes?sort=oldest').set(me.auth);
    expect(titles(oldest.body)).toEqual(['עוגת שוקולד', 'עוגת גבינה', 'סלט ירקות']);
    const prep = await api.get('/api/recipes?sort=prepTime').set(me.auth);
    expect(prep.body.items.map((r: RecipeItem) => r.prepTimeMinutes)).toEqual([15, 50, 90]);
    const byTitle = await api.get('/api/recipes?sort=title').set(me.auth);
    expect(titles(byTitle.body)).toEqual(['סלט ירקות', 'עוגת גבינה', 'עוגת שוקולד']);
  });

  it('paginates', async () => {
    const { me } = await seedList();
    const page1 = await api.get('/api/recipes?limit=2&page=1').set(me.auth);
    const page2 = await api.get('/api/recipes?limit=2&page=2').set(me.auth);
    expect(page1.body.items).toHaveLength(2);
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('empty query values are treated as "no filter"', async () => {
    const { me } = await seedList();
    const res = await api.get('/api/recipes?search=&categoryId=&difficulty=&sort=').set(me.auth);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(3);
  });

  it('/mine shows only my recipes, private and public, with an isPublic filter', async () => {
    const { me } = await seedList();
    const all = await api.get('/api/recipes/mine').set(me.auth);
    expect(titles(all.body)).toEqual(['אפונה פרטית שלי', 'סלט ירקות']);

    const privateOnly = await api.get('/api/recipes/mine?isPublic=false').set(me.auth);
    expect(titles(privateOnly.body)).toEqual(['אפונה פרטית שלי']);

    const publicOnly = await api.get('/api/recipes/mine?isPublic=true').set(me.auth);
    expect(titles(publicOnly.body)).toEqual(['סלט ירקות']);

    expect((await api.get('/api/recipes/mine?isPublic=maybe').set(me.auth)).status).toBe(400);
  });
});
