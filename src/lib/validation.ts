// =====================================================================
// עזר לוולידציה עם Zod: בודק נתונים ומחזיר שגיאה 400 מסודרת
// =====================================================================
import type { z } from 'zod';
import { validationError } from './errors';

export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw validationError(
      result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
        message: issue.message,
      })),
    );
  }
  return result.data;
}
