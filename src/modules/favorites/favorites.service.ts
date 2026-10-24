// =====================================================================
// לוגיקה עסקית של מועדפים
// =====================================================================
import { prisma } from '../../db/prisma';
import type { AuthUser } from '../../types/express';
import {
  findVisibleRecipe,
  paginationMeta,
  recipeSelect,
  toRecipeDto,
  visibleTo,
  type PaginationQuery,
} from '../recipes/recipes.service';

export async function listFavorites(user: AuthUser, query: PaginationQuery) {
  // מציגים רק מתכונים שעדיין גלויים למשתמש (למשל: אם הבעלים הפך מתכון לפרטי – הוא לא יוצג)
  const where = { userId: user.id, recipe: visibleTo(user) };
  // שתי שאילתות במקביל: ספירה + העמוד הנוכחי
  const [total, rows] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { recipeId: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: { createdAt: true, recipe: { select: recipeSelect(user.id) } },
    }),
  ]);

  return {
    items: rows.map((row) => ({ ...toRecipeDto(row.recipe, user), favoritedAt: row.createdAt })),
    pagination: paginationMeta(query.page, query.limit, total),
  };
}

/** מחזיר true אם נוצרה רשומה חדשה, false אם המתכון כבר היה במועדפים */
export async function addFavorite(user: AuthUser, recipeId: number): Promise<boolean> {
  // אפשר להוסיף רק מתכון שהמשתמש רשאי לראות (אחרת 404)
  await findVisibleRecipe(user, recipeId);
  const result = await prisma.favorite.createMany({
    data: [{ userId: user.id, recipeId }],
    skipDuplicates: true,
  });
  return result.count > 0;
}

export async function removeFavorite(user: AuthUser, recipeId: number): Promise<void> {
  // מוחקים רק את המועדף של המשתמש הנוכחי
  await prisma.favorite.deleteMany({ where: { userId: user.id, recipeId } });
}
