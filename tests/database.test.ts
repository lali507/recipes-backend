import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ensureDefaultCategories, isStrongPassword, seedDemoRecipes } from '../src/bootstrap/bootstrap';
import { DEFAULT_CATEGORIES, DEMO_RECIPES } from '../src/bootstrap/demoData';
import { createCategory, createUser, prisma, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Prisma migrations and database constraints', () => {
  it('all migrations in prisma/migrations were applied to the database', async () => {
    const dirs = readdirSync(join(__dirname, '..', 'prisma', 'migrations'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
    expect(applied.map((m) => m.migration_name)).toEqual(dirs);
  });

  it('email is unique at the database level', async () => {
    await createUser({ email: 'same@example.com' });
    await expect(createUser({ email: 'same@example.com' })).rejects.toThrow();
  });

  it('CHECK constraints reject invalid values even without the API', async () => {
    const { user } = await createUser();
    const category = await createCategory();
    const base = {
      title: 'תקין',
      description: 'תיאור תקין',
      ingredients: 'רכיב',
      instructions: 'הוראות',
      difficulty: 'EASY' as const,
      kosherType: 'PAREVE' as const,
      authorId: user.id,
      categoryId: category.id,
    };
    await expect(prisma.recipe.create({ data: { ...base, prepTimeMinutes: 0, servings: 4 } })).rejects.toThrow();
    await expect(prisma.recipe.create({ data: { ...base, prepTimeMinutes: 10, servings: 101 } })).rejects.toThrow();
    await expect(prisma.recipe.create({ data: { ...base, title: ' ', prepTimeMinutes: 10, servings: 4 } })).rejects.toThrow();
    await expect(prisma.recipe.create({ data: { ...base, prepTimeMinutes: 10, servings: 4 } })).resolves.toBeTruthy();
  });

  it('a category with recipes cannot be deleted at the database level (RESTRICT)', async () => {
    const { user } = await createUser();
    const category = await createCategory();
    await prisma.recipe.create({
      data: {
        title: 'מתכון',
        description: 'תיאור מתכון',
        ingredients: 'רכיב',
        instructions: 'הוראות',
        prepTimeMinutes: 5,
        servings: 1,
        difficulty: 'EASY',
        kosherType: 'PAREVE',
        authorId: user.id,
        categoryId: category.id,
      },
    });
    await expect(prisma.category.delete({ where: { id: category.id } })).rejects.toThrow();
  });

  it('deleting a user cascades to their recipes and favorites', async () => {
    const { user } = await createUser();
    const other = await createUser();
    const category = await createCategory();
    const recipe = await prisma.recipe.create({
      data: {
        title: 'מתכון',
        description: 'תיאור מתכון',
        ingredients: 'רכיב',
        instructions: 'הוראות',
        prepTimeMinutes: 5,
        servings: 1,
        difficulty: 'EASY',
        kosherType: 'PAREVE',
        isPublic: true,
        authorId: user.id,
        categoryId: category.id,
      },
    });
    await prisma.favorite.create({ data: { userId: other.user.id, recipeId: recipe.id } });
    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.recipe.count()).toBe(0);
    expect(await prisma.favorite.count()).toBe(0);
  });
});

describe('bootstrap and demo data', () => {
  it('creates the default categories only when the table is empty', async () => {
    await ensureDefaultCategories(prisma);
    expect(await prisma.category.count()).toBe(DEFAULT_CATEGORIES.length);
    await ensureDefaultCategories(prisma);
    expect(await prisma.category.count()).toBe(DEFAULT_CATEGORIES.length);
  });

  it('seeds demo recipes once per author', async () => {
    await ensureDefaultCategories(prisma);
    const sara = await createUser();
    const david = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const created = await seedDemoRecipes(prisma, { sara: sara.user.id, david: david.user.id, admin: admin.user.id });
    expect(created).toBe(DEMO_RECIPES.length);
    expect(await seedDemoRecipes(prisma, { sara: sara.user.id })).toBe(0);
    expect(await prisma.recipe.count({ where: { isPublic: false } })).toBeGreaterThan(0);
    expect(await prisma.recipe.count({ where: { isPublic: true } })).toBeGreaterThan(0);
  });

  it('checks password strength for env-created accounts', () => {
    expect(isStrongPassword('Admin1234')).toBe(true);
    expect(isStrongPassword('short1')).toBe(false);
    expect(isStrongPassword('onlyletters')).toBe(false);
    expect(isStrongPassword('12345678')).toBe(false);
  });
});
