// =====================================================================
// לוגיקה עסקית של מתכונים, כולל כל בדיקות ההרשאות והפרטיות
// =====================================================================
import { prisma } from '../../db/prisma';
import type { Prisma } from '../../generated/prisma/client';
import { AppError, badRequest, forbidden, notFound, serviceUnavailable } from '../../lib/errors';
import { detectImageType, type ImageStorage } from '../../lib/imageStorage';
import type { AuthUser } from '../../types/express';
import type {
  CreateRecipeInput,
  MyRecipesQuery,
  PaginationQuery,
  RecipeListQuery,
  UpdateRecipeInput,
} from './recipes.schemas';

// ---------------------------------------------------------------------
// אילו שדות שולפים ואיך מחזירים מתכון ללקוח
// ---------------------------------------------------------------------
export function recipeSelect(viewerId: number) {
  return {
    id: true,
    title: true,
    description: true,
    ingredients: true,
    instructions: true,
    prepTimeMinutes: true,
    difficulty: true,
    servings: true,
    kosherType: true,
    isPublic: true,
    imageUrl: true,
    imagePublicId: true,
    authorId: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true } },
    author: { select: { id: true, name: true } },
    // רק רשומת המועדף של המשתמש הנוכחי – כדי לדעת אם המתכון אצלו במועדפים
    favorites: { where: { userId: viewerId }, select: { userId: true } },
  } satisfies Prisma.RecipeSelect;
}

type RecipeRow = Prisma.RecipeGetPayload<{ select: ReturnType<typeof recipeSelect> }>;

export function toRecipeDto(recipe: RecipeRow, viewer: AuthUser) {
  // לא מחזירים ללקוח את imagePublicId, authorId ואת רשימת המועדפים הגולמית
  const { imagePublicId: _p, authorId, favorites, ...rest } = recipe;
  const isOwner = authorId === viewer.id;
  const canManage = canManageRecipe(viewer, recipe);
  return {
    ...rest,
    isFavorite: favorites.length > 0,
    isOwner,
    canEdit: canManage,
    canDelete: canManage,
  };
}

/** עריכה ומחיקה: היוצר, או מנהל על מתכון ציבורי (מתכון פרטי של אחר המנהל בכלל לא רואה) */
function canManageRecipe(user: AuthUser, recipe: { authorId: number; isPublic: boolean }) {
  return recipe.authorId === user.id || (user.role === 'ADMIN' && recipe.isPublic);
}

export type RecipeDto = ReturnType<typeof toRecipeDto>;

/** תנאי: מתכונים שהמשתמש רשאי לראות */
export function visibleTo(user: AuthUser): Prisma.RecipeWhereInput {
  return { OR: [{ isPublic: true }, { authorId: user.id }] };
}

function buildFilters(query: RecipeListQuery): Prisma.RecipeWhereInput[] {
  const filters: Prisma.RecipeWhereInput[] = [];
  if (query.search) {
    const contains = { contains: query.search, mode: 'insensitive' as const };
    filters.push({ OR: [{ title: contains }, { description: contains }, { ingredients: contains }] });
  }
  if (query.categoryId) filters.push({ categoryId: query.categoryId });
  if (query.authorId) filters.push({ authorId: query.authorId });
  if (query.difficulty) filters.push({ difficulty: query.difficulty });
  if (query.kosherType) filters.push({ kosherType: query.kosherType });
  if (query.maxPrepTime) filters.push({ prepTimeMinutes: { lte: query.maxPrepTime } });
  return filters;
}

function buildOrderBy(sort: RecipeListQuery['sort']): Prisma.RecipeOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case 'prepTime':
      return [{ prepTimeMinutes: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
    case 'title':
      return [{ title: 'asc' }, { id: 'asc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function paginate(user: AuthUser, where: Prisma.RecipeWhereInput, query: RecipeListQuery) {
  // שתי שאילתות במקביל: ספירה + העמוד הנוכחי
  const [total, rows] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: recipeSelect(user.id),
    }),
  ]);
  return { items: rows.map((r) => toRecipeDto(r, user)), pagination: paginationMeta(query.page, query.limit, total) };
}

// ---------------------------------------------------------------------
// רשימות
// ---------------------------------------------------------------------
export function listPublicRecipes(user: AuthUser, query: RecipeListQuery) {
  return paginate(user, { AND: [{ isPublic: true }, ...buildFilters(query)] }, query);
}

/** מפרסמים שיש להם לפחות מתכון ציבורי אחד – לתיבת הסינון לפי מפרסם */
export async function listAuthors() {
  const authors = await prisma.user.findMany({
    where: { recipes: { some: { isPublic: true } } },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, _count: { select: { recipes: { where: { isPublic: true } } } } },
  });
  return authors.map(({ _count, ...author }) => ({ ...author, recipeCount: _count.recipes }));
}

export function listMyRecipes(user: AuthUser, query: MyRecipesQuery) {
  const filters = buildFilters(query);
  if (query.isPublic !== undefined) filters.push({ isPublic: query.isPublic });
  return paginate(user, { AND: [{ authorId: user.id }, ...filters] }, query);
}

// ---------------------------------------------------------------------
// שליפה עם בדיקת הרשאות
// ---------------------------------------------------------------------
/** מחזיר מתכון רק אם המשתמש רשאי לראות אותו. מתכון פרטי של אחר = 404 */
async function findVisibleRecipe(user: AuthUser, id: number) {
  const recipe = await prisma.recipe.findUnique({ where: { id }, select: recipeSelect(user.id) });
  if (!recipe || (!recipe.isPublic && recipe.authorId !== user.id)) {
    throw notFound('המתכון לא נמצא');
  }
  return recipe;
}

async function findEditableRecipe(user: AuthUser, id: number) {
  const recipe = await findVisibleRecipe(user, id);
  if (!canManageRecipe(user, recipe)) {
    throw forbidden('רק יוצר המתכון או מנהל יכולים לערוך אותו');
  }
  return recipe;
}

async function ensureCategoryExists(categoryId: number) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    throw badRequest('הקטגוריה שנבחרה לא קיימת', [{ field: 'categoryId', message: 'הקטגוריה לא קיימת' }]);
  }
}

export async function getRecipe(user: AuthUser, id: number) {
  return toRecipeDto(await findVisibleRecipe(user, id), user);
}

// ---------------------------------------------------------------------
// יצירה, עדכון ומחיקה
// ---------------------------------------------------------------------
export async function createRecipe(user: AuthUser, input: CreateRecipeInput) {
  await ensureCategoryExists(input.categoryId);
  const recipe = await prisma.recipe.create({
    // היוצר נקבע לפי ה-Token בלבד – לא לפי מה שהלקוח שלח
    data: { ...input, authorId: user.id },
    select: recipeSelect(user.id),
  });
  return toRecipeDto(recipe, user);
}

export async function updateRecipe(user: AuthUser, id: number, input: UpdateRecipeInput) {
  await findEditableRecipe(user, id);
  await ensureCategoryExists(input.categoryId);
  const recipe = await prisma.recipe.update({ where: { id }, data: input, select: recipeSelect(user.id) });
  return toRecipeDto(recipe, user);
}

async function safeDeleteImage(storage: ImageStorage, publicId: string | null) {
  if (!publicId || !storage.isConfigured()) return;
  try {
    await storage.delete(publicId);
  } catch (error) {
    // כשל במחיקת תמונה ישנה לא אמור להכשיל את הפעולה עצמה
    console.warn('Failed to delete image from storage:', publicId, error);
  }
}

export async function deleteRecipe(user: AuthUser, id: number, storage: ImageStorage) {
  const recipe = await findVisibleRecipe(user, id);
  if (!canManageRecipe(user, recipe)) {
    throw forbidden('אין לך הרשאה למחוק מתכון זה');
  }
  await prisma.recipe.delete({ where: { id } });
  await safeDeleteImage(storage, recipe.imagePublicId);
}

// ---------------------------------------------------------------------
// תמונות
// ---------------------------------------------------------------------
/** בדיקות לפני קבלת הקובץ: המתכון קיים, המשתמש רשאי לערוך אותו, והאחסון מוגדר */
export async function assertCanUploadImage(user: AuthUser, id: number, storage: ImageStorage) {
  await findEditableRecipe(user, id);
  if (!storage.isConfigured()) {
    throw serviceUnavailable(
      'העלאת תמונות אינה זמינה: Cloudinary לא הוגדר בשרת',
      'IMAGE_STORAGE_NOT_CONFIGURED',
    );
  }
}

export async function setRecipeImage(
  user: AuthUser,
  id: number,
  file: Express.Multer.File | undefined,
  storage: ImageStorage,
) {
  if (!file) {
    throw badRequest('לא נשלח קובץ. יש לשלוח קובץ בשדה בשם image', [
      { field: 'image', message: 'קובץ תמונה הוא שדה חובה' },
    ]);
  }
  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'הקובץ אינו תמונה תקינה מסוג JPG, PNG או WEBP');
  }

  const existing = await findEditableRecipe(user, id);
  const stored = await storage.upload(file.buffer, detected);
  const recipe = await prisma.recipe.update({
    where: { id },
    data: { imageUrl: stored.url, imagePublicId: stored.publicId },
    select: recipeSelect(user.id),
  });
  await safeDeleteImage(storage, existing.imagePublicId);
  return toRecipeDto(recipe, user);
}

export async function removeRecipeImage(user: AuthUser, id: number, storage: ImageStorage) {
  const existing = await findEditableRecipe(user, id);
  const recipe = await prisma.recipe.update({
    where: { id },
    data: { imageUrl: null, imagePublicId: null },
    select: recipeSelect(user.id),
  });
  await safeDeleteImage(storage, existing.imagePublicId);
  return toRecipeDto(recipe, user);
}

// ---------------------------------------------------------------------
// עזר למועדפים
// ---------------------------------------------------------------------
export { findVisibleRecipe };
export type { PaginationQuery };
