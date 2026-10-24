// =====================================================================
// פעולות אוטומטיות בעליית השרת (בטוחות להרצה חוזרת):
// 1. יצירת קטגוריות ברירת מחדל – רק אם אין אף קטגוריה.
// 2. יצירת מנהל ממשתני הסביבה ADMIN_EMAIL + ADMIN_PASSWORD.
// 3. נתוני הדגמה בענן – רק אם SEED_DEMO_DATA=true ו-DEMO_USER_PASSWORD הוגדר.
// בענן אין סיסמאות קבועות וידועות: כל הסיסמאות מגיעות ממשתני סביבה.
// =====================================================================
import type { PrismaClient } from '../generated/prisma/client';
import { env } from '../config/env';
import { hashPassword } from '../lib/password';
import { DEFAULT_CATEGORIES, DEMO_RECIPES, type DemoAuthorKey } from './demoData';

const log = (message: string) => {
  if (env.NODE_ENV !== 'test') console.log(`[bootstrap] ${message}`);
};

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z֐-׿]/.test(password) && /\d/.test(password);
}

export async function ensureDefaultCategories(prisma: PrismaClient): Promise<void> {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULT_CATEGORIES.map((name) => ({ name })), skipDuplicates: true });
  log(`created ${DEFAULT_CATEGORIES.length} default categories`);
}

async function ensureUser(
  prisma: PrismaClient,
  data: { email: string; name: string; password: string; role: 'USER' | 'ADMIN' },
): Promise<number> {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing) {
    // לא משנים סיסמה של משתמש קיים. רק מוודאים שמנהל אכן מוגדר כמנהל.
    if (data.role === 'ADMIN' && existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
      log(`promoted ${email} to ADMIN`);
    }
    return existing.id;
  }
  const user = await prisma.user.create({
    data: { email, name: data.name, role: data.role, passwordHash: await hashPassword(data.password) },
    select: { id: true },
  });
  log(`created ${data.role} ${email}`);
  return user.id;
}

/** יוצר את מתכוני ההדגמה לכל משתמש שעדיין אין לו מתכונים */
export async function seedDemoRecipes(
  prisma: PrismaClient,
  authors: Partial<Record<DemoAuthorKey, number>>,
): Promise<number> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));
  let created = 0;

  for (const [key, authorId] of Object.entries(authors) as [DemoAuthorKey, number][]) {
    const hasRecipes = await prisma.recipe.count({ where: { authorId } });
    if (hasRecipes > 0) continue;

    // מתכונים נוצרים בהפרשי זמן, כדי שמיון "החדש ביותר" יהיה משמעותי
    const recipes = DEMO_RECIPES.filter((r) => r.author === key);
    for (const [index, recipe] of recipes.entries()) {
      const catId = categoryId.get(recipe.category);
      if (!catId) continue;
      const { author: _a, category: _c, ...fields } = recipe;
      await prisma.recipe.create({
        data: {
          ...fields,
          authorId,
          categoryId: catId,
          createdAt: new Date(Date.now() - (recipes.length - index) * 60 * 60 * 1000),
        },
      });
      created += 1;
    }
  }
  return created;
}

export async function runBootstrap(prisma: PrismaClient): Promise<void> {
  await ensureDefaultCategories(prisma);

  let adminId: number | undefined;
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    if (!isStrongPassword(env.ADMIN_PASSWORD)) {
      console.warn('[bootstrap] ADMIN_PASSWORD חלשה מדי (לפחות 8 תווים, אות וספרה). המנהל לא נוצר.');
    } else {
      adminId = await ensureUser(prisma, {
        email: env.ADMIN_EMAIL,
        name: env.ADMIN_NAME,
        password: env.ADMIN_PASSWORD,
        role: 'ADMIN',
      });
    }
  }

  if (env.SEED_DEMO_DATA) {
    if (!env.DEMO_USER_PASSWORD || !isStrongPassword(env.DEMO_USER_PASSWORD)) {
      console.warn('[bootstrap] SEED_DEMO_DATA=true אבל DEMO_USER_PASSWORD חסרה או חלשה. נתוני הדגמה לא נוצרו.');
      return;
    }
    const sara = await ensureUser(prisma, {
      email: 'sara@example.com',
      name: 'שרה לוי',
      password: env.DEMO_USER_PASSWORD,
      role: 'USER',
    });
    const david = await ensureUser(prisma, {
      email: 'david@example.com',
      name: 'דוד כהן',
      password: env.DEMO_USER_PASSWORD,
      role: 'USER',
    });
    const created = await seedDemoRecipes(prisma, { sara, david, ...(adminId ? { admin: adminId } : {}) });
    if (created > 0) log(`created ${created} demo recipes`);
  }
}
