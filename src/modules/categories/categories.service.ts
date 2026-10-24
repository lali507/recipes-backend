// =====================================================================
// לוגיקה עסקית של קטגוריות
// =====================================================================
import { prisma } from '../../db/prisma';
import { conflict, notFound } from '../../lib/errors';
import type { AuthUser } from '../../types/express';
import type { CategoryBody } from './categories.schemas';

/** מתכונים שהמשתמש רשאי לראות: ציבוריים, או שלו */
function visibleRecipesWhere(user: AuthUser) {
  return { OR: [{ isPublic: true }, { authorId: user.id }] };
}

export async function listCategories(user: AuthUser) {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { recipes: { where: visibleRecipesWhere(user) } } },
    },
  });

  // למנהל מחזירים גם את המספר הכולל (כולל פרטיים), כדי לדעת אם אפשר למחוק.
  // מחזירים רק מספר – לא את תוכן המתכונים הפרטיים.
  let totals = new Map<number, number>();
  if (user.role === 'ADMIN') {
    const grouped = await prisma.recipe.groupBy({ by: ['categoryId'], _count: { _all: true } });
    totals = new Map(grouped.map((g) => [g.categoryId, g._count._all]));
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    recipeCount: c._count.recipes,
    ...(user.role === 'ADMIN' ? { totalRecipeCount: totals.get(c.id) ?? 0 } : {}),
  }));
}

async function ensureNameAvailable(name: string, exceptId?: number) {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw conflict('כבר קיימת קטגוריה בשם הזה', 'CATEGORY_NAME_TAKEN');
  }
}

export async function createCategory(input: CategoryBody) {
  await ensureNameAvailable(input.name);
  const category = await prisma.category.create({ data: { name: input.name }, select: { id: true, name: true } });
  return { ...category, recipeCount: 0, totalRecipeCount: 0 };
}

export async function updateCategory(id: number, input: CategoryBody) {
  const exists = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    throw notFound('הקטגוריה לא נמצאה');
  }
  await ensureNameAvailable(input.name, id);
  const category = await prisma.category.update({
    where: { id },
    data: { name: input.name },
    select: { id: true, name: true, _count: { select: { recipes: true } } },
  });
  return {
    id: category.id,
    name: category.name,
    recipeCount: category._count.recipes,
    totalRecipeCount: category._count.recipes,
  };
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { recipes: true } } },
  });
  if (!category) {
    throw notFound('הקטגוריה לא נמצאה');
  }
  if (category._count.recipes > 0) {
    throw conflict('לא ניתן למחוק קטגוריה שיש בה מתכונים', 'CATEGORY_IN_USE');
  }
  await prisma.category.delete({ where: { id } });
}
