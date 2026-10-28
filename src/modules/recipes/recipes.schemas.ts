// =====================================================================
// ולידציה למתכונים: גוף הבקשה (יצירה/עדכון) ופרמטרים לחיפוש
// =====================================================================
import { z } from 'zod';
import { Difficulty, KosherType } from '../../generated/prisma/enums';
import { positiveId } from '../../lib/commonSchemas';

/** מקבל מספר, או מחרוזת שמכילה רק ספרות (נוח לטפסים) */
const intField = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value) : value),
    z
      .number({ error: `${label} חייב להיות מספר` })
      .int(`${label} חייב להיות מספר שלם`)
      .min(min, `${label} חייב להיות לפחות ${min}`)
      .max(max, `${label} יכול להיות לכל היותר ${max}`),
  );

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} הוא שדה חובה` })
    .trim()
    .min(min, min === 1 ? `${label} הוא שדה חובה` : `${label} חייב להכיל לפחות ${min} תווים`)
    .max(max, `${label} יכול להכיל עד ${max} תווים`);

const difficulty = z.enum(Difficulty, { error: 'רמת הקושי חייבת להיות EASY, MEDIUM או HARD' });
const kosherType = z.enum(KosherType, { error: 'סוג הכשרות חייב להיות MEAT, DAIRY או PAREVE' });

const baseFields = {
  title: text('שם המתכון', 2, 100),
  description: text('התיאור', 5, 500),
  ingredients: text('הרכיבים', 1, 5000),
  instructions: text('אופן ההכנה', 1, 10000),
  prepTimeMinutes: intField('זמן ההכנה', 1, 1440),
  difficulty,
  servings: intField('מספר המנות', 1, 100),
  kosherType,
  categoryId: positiveId('מזהה הקטגוריה'),
};

/** יצירת מתכון – isPublic לא חובה (ברירת מחדל: פרטי) */
export const createRecipeSchema = z.object({
  ...baseFields,
  isPublic: z.boolean({ error: 'isPublic חייב להיות true או false' }).default(false),
});

/** עדכון מתכון (PUT) – שולחים את כל השדות, כולל isPublic */
export const updateRecipeSchema = z.object({
  ...baseFields,
  isPublic: z.boolean({ error: 'isPublic הוא שדה חובה (true או false)' }),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

// ---------------------------------------------------------------------
// פרמטרים לחיפוש, סינון, מיון ועמודים
// ---------------------------------------------------------------------
const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

export const SORT_OPTIONS = ['newest', 'oldest', 'prepTime', 'title'] as const;

export const paginationSchema = z.object({
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1, 'מספר העמוד חייב להיות 1 ומעלה').default(1)),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1, 'limit חייב להיות לפחות 1').max(50, 'limit יכול להיות לכל היותר 50').default(12),
  ),
});

export const recipeListQuerySchema = paginationSchema.extend({
  search: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'search חייב להיות טקסט' }).trim().max(100, 'החיפוש ארוך מדי').optional(),
  ),
  categoryId: z.preprocess(emptyToUndefined, positiveId('מזהה הקטגוריה').optional()),
  authorId: z.preprocess(emptyToUndefined, positiveId('מזהה המפרסם').optional()),
  difficulty: z.preprocess(emptyToUndefined, difficulty.optional()),
  kosherType: z.preprocess(emptyToUndefined, kosherType.optional()),
  maxPrepTime: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: 'maxPrepTime חייב להיות מספר' })
      .int('maxPrepTime חייב להיות מספר שלם')
      .min(1, 'maxPrepTime חייב להיות לפחות 1')
      .max(1440, 'maxPrepTime יכול להיות לכל היותר 1440')
      .optional(),
  ),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(SORT_OPTIONS, { error: 'sort חייב להיות newest, oldest, prepTime או title' }).default('newest'),
  ),
});

export const myRecipesQuerySchema = recipeListQuerySchema.extend({
  isPublic: z.preprocess(
    emptyToUndefined,
    z
      .enum(['true', 'false'], { error: 'isPublic חייב להיות true או false' })
      .transform((v) => v === 'true')
      .optional(),
  ),
});

export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>;
export type MyRecipesQuery = z.infer<typeof myRecipesQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
