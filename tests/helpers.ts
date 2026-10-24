// =====================================================================
// כלי עזר לבדיקות: איפוס מסד הנתונים, יצירת משתמשים ונתונים, אפליקציה לבדיקה
// =====================================================================
import supertest from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';
import type { Difficulty, KosherType, Role } from '../src/generated/prisma/enums';
import type { ImageStorage, StoredImage } from '../src/lib/imageStorage';
import { signAccessToken } from '../src/lib/jwt';
import { hashPassword } from '../src/lib/password';

export { prisma };

/** אחסון תמונות מזויף – שומר בזיכרון מה הועלה ומה נמחק */
export class FakeImageStorage implements ImageStorage {
  uploads: { mimeType: string; size: number; publicId: string }[] = [];
  deleted: string[] = [];
  private counter = 0;
  constructor(public configured = true) {}
  isConfigured() {
    return this.configured;
  }
  async upload(file: Buffer, mimeType: string): Promise<StoredImage> {
    this.counter += 1;
    const publicId = `test/image-${this.counter}`;
    this.uploads.push({ mimeType, size: file.length, publicId });
    return { url: `https://images.example.test/${publicId}.jpg`, publicId };
  }
  async delete(publicId: string) {
    this.deleted.push(publicId);
  }
}

export function makeApi(storage: ImageStorage = new FakeImageStorage(), authRateLimitMax = 1000) {
  return supertest(createApp({ imageStorage: storage, authRateLimitMax }));
}

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "favorites", "recipes", "categories", "users" RESTART IDENTITY CASCADE',
  );
}

let userCounter = 0;
export async function createUser(options: { role?: Role; email?: string; password?: string; name?: string } = {}) {
  userCounter += 1;
  const password = options.password ?? 'Password123';
  const user = await prisma.user.create({
    data: {
      name: options.name ?? `משתמש ${userCounter}`,
      email: options.email ?? `user${userCounter}-${Date.now()}@example.com`,
      role: options.role ?? 'USER',
      passwordHash: await hashPassword(password),
    },
  });
  return { user, password, token: signAccessToken(user), auth: { Authorization: `Bearer ${signAccessToken(user)}` } };
}

export async function createCategory(name = `קטגוריה ${Math.random().toString(36).slice(2, 8)}`) {
  return prisma.category.create({ data: { name } });
}

export type RecipeOverrides = Partial<{
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prepTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  kosherType: KosherType;
  isPublic: boolean;
  imageUrl: string | null;
  imagePublicId: string | null;
  createdAt: Date;
}>;

export async function createRecipe(authorId: number, categoryId: number, overrides: RecipeOverrides = {}) {
  return prisma.recipe.create({
    data: {
      title: 'מתכון בדיקה',
      description: 'תיאור של מתכון בדיקה',
      ingredients: 'קמח\nמים',
      instructions: 'מערבבים ואופים',
      prepTimeMinutes: 30,
      difficulty: 'EASY',
      servings: 4,
      kosherType: 'PAREVE',
      isPublic: true,
      ...overrides,
      authorId,
      categoryId,
    },
  });
}

/** גוף בקשה תקין ליצירת מתכון */
export function validRecipeBody(categoryId: number, overrides: Record<string, unknown> = {}) {
  return {
    title: 'עוגת שמרים',
    description: 'עוגה רכה ואוורירית לשבת',
    ingredients: '1 ק"ג קמח\n50 גרם שמרים',
    instructions: '1. לשים בצק.\n2. אופים.',
    prepTimeMinutes: 90,
    difficulty: 'MEDIUM',
    servings: 12,
    kosherType: 'PAREVE',
    isPublic: true,
    categoryId,
    ...overrides,
  };
}

// קבצים קטנים לבדיקת העלאת תמונות
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
export const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
