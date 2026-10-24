// הגדרות Prisma: מיקום הסכמה, תיקיית ה-Migrations, פקודת ה-Seed
// וכתובת מסד הנתונים (מתוך משתנה הסביבה DATABASE_URL).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // בזמן "npm install" ייתכן שעדיין אין DATABASE_URL – זה בסדר.
    // פקודות מסד הנתונים (migrate / seed) ידרשו אותו.
    url: process.env.DATABASE_URL ?? '',
  },
});
