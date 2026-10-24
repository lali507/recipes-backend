// טוען את משתני הסביבה לבדיקות מתוך .env.test
// ובודק שמדובר במסד נתונים לבדיקות בלבד (כדי לא למחוק בטעות נתונים אמיתיים)
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function loadTestEnv(): void {
  const file = join(__dirname, '..', '..', '.env.test');
  if (existsSync(file)) {
    config({ path: file, override: true, quiet: true });
  }

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'test-secret-for-automated-tests-only-0123456789';
  process.env.JWT_EXPIRES_IN ??= '1h';
  process.env.BCRYPT_ROUNDS ??= '4';
  process.env.AUTH_RATE_LIMIT_MAX ??= '1000';
  process.env.CORS_ORIGINS ??= 'http://localhost:5173';
  // בבדיקות לא מתחברים ל-Cloudinary אמיתי
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.SEED_DEMO_DATA;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('חסר DATABASE_URL לבדיקות. צרי קובץ .env.test לפי .env.test.example');
  }
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!/test/i.test(dbName)) {
    throw new Error(`מסיבות בטיחות, שם מסד הנתונים לבדיקות חייב לכלול "test" (כרגע: "${dbName}")`);
  }
}
