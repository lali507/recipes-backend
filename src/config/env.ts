// =====================================================================
// קריאה ובדיקה של משתני הסביבה (Environment Variables)
// אם חסר משתנה חובה – השרת לא יעלה, ותוצג הודעה ברורה.
// =====================================================================
import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((value) => value === 'true' || value === '1');

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z
    .string({ error: 'DATABASE_URL חסר – יש להגדיר כתובת חיבור ל-PostgreSQL' })
    .min(1, 'DATABASE_URL חסר – יש להגדיר כתובת חיבור ל-PostgreSQL')
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL חייב להתחיל ב-postgresql:// או postgres://',
    }),

  JWT_SECRET: z
    .string({ error: 'JWT_SECRET חסר – יש להגדיר מחרוזת סודית ארוכה' })
    .min(32, 'JWT_SECRET חייב להכיל לפחות 32 תווים'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN חייב להיות בפורמט כמו 15m, 12h או 1d')
    .default('1d'),

  // רשימת כתובות מופרדות בפסיקים, או * כדי לאפשר לכולם
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  // כמה ניסיונות התחברות/הרשמה מותרים לכל כתובת IP בחלון של 15 דקות
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),

  // Cloudinary – לא חובה. בלי שלושת אלה העלאת תמונות תחזיר 503.
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CLOUDINARY_FOLDER: z.string().default('recipes-app'),

  // יצירת מנהל אוטומטית בעליית השרת (מומלץ בענן)
  ADMIN_EMAIL: optionalString,
  ADMIN_PASSWORD: optionalString,
  ADMIN_NAME: z.string().default('מנהל האתר'),

  // נתוני הדגמה בענן (לא חובה)
  SEED_DEMO_DATA: booleanFromString,
  DEMO_USER_PASSWORD: optionalString,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`);
    // הודעה ברורה במקום קריסה לא מובנת
    console.error('\n❌ הגדרות הסביבה אינן תקינות:\n' + lines.join('\n') + '\n');
    console.error('בדקי את קובץ .env (במחשב) או את Environment Variables (בענן).\n');
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins: string[] | '*' =
  env.CORS_ORIGINS.trim() === '*'
    ? '*'
    : env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);
