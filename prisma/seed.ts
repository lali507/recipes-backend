// =====================================================================
// Seed – נתוני הדגמה למחשב המקומי (npm run db:seed)
// ⚠️ מוחק את כל הנתונים הקיימים ויוצר אותם מחדש.
// לא רץ בסביבת Production – שם משתמשים במשתני הסביבה (ראו START-HERE.md).
// =====================================================================
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { seedDemoRecipes } from '../src/bootstrap/bootstrap';
import { DEFAULT_CATEGORIES } from '../src/bootstrap/demoData';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/password';

// סיסמאות קבועות – רק לפיתוח מקומי!
export const DEMO_ACCOUNTS = {
  admin: { name: 'מנהל האתר', email: 'admin@example.com', password: 'Admin1234', role: 'ADMIN' },
  sara: { name: 'שרה לוי', email: 'sara@example.com', password: 'User1234', role: 'USER' },
  david: { name: 'דוד כהן', email: 'david@example.com', password: 'User1234', role: 'USER' },
} as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ה-Seed לא רץ ב-Production (יש בו סיסמאות ידועות).');
    console.error('   בענן השתמשי ב-ADMIN_EMAIL / ADMIN_PASSWORD ו-SEED_DEMO_DATA. ראי START-HERE.md');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL חסר בקובץ .env');
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    console.log('🧹 מוחק נתונים קיימים...');
    await prisma.favorite.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('📂 יוצר קטגוריות...');
    await prisma.category.createMany({ data: DEFAULT_CATEGORIES.map((name) => ({ name })) });

    console.log('👤 יוצר משתמשים...');
    const ids: Record<keyof typeof DEMO_ACCOUNTS, number> = { admin: 0, sara: 0, david: 0 };
    for (const [key, account] of Object.entries(DEMO_ACCOUNTS) as [keyof typeof DEMO_ACCOUNTS, (typeof DEMO_ACCOUNTS)[keyof typeof DEMO_ACCOUNTS]][]) {
      const user = await prisma.user.create({
        data: {
          name: account.name,
          email: account.email,
          role: account.role,
          passwordHash: await hashPassword(account.password),
        },
      });
      ids[key] = user.id;
    }

    console.log('🍰 יוצר מתכונים...');
    const recipeCount = await seedDemoRecipes(prisma, ids);

    console.log('⭐ יוצר מועדפים...');
    const publicOfOthers = await prisma.recipe.findMany({
      where: { isPublic: true, authorId: { not: ids.sara } },
      select: { id: true },
      take: 3,
      orderBy: { id: 'asc' },
    });
    await prisma.favorite.createMany({ data: publicOfOthers.map((r) => ({ userId: ids.sara, recipeId: r.id })) });

    console.log(`\n✅ Seed הסתיים: ${DEFAULT_CATEGORIES.length} קטגוריות, 3 משתמשים, ${recipeCount} מתכונים.\n`);
    console.log('חשבונות לבדיקה (מקומי בלבד):');
    for (const account of Object.values(DEMO_ACCOUNTS)) {
      console.log(`  ${account.role.padEnd(5)}  ${account.email.padEnd(20)}  ${account.password}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ ה-Seed נכשל:', error);
  process.exit(1);
});
