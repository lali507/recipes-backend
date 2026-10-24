// =====================================================================
// ולידציה לבקשות התחברות והרשמה
// =====================================================================
import { z } from 'zod';

const email = z
  .string({ error: 'אימייל הוא שדה חובה' })
  .trim()
  .toLowerCase()
  .max(254, 'האימייל ארוך מדי')
  .pipe(z.email({ error: 'כתובת האימייל אינה תקינה' }));

export const registerSchema = z.object({
  name: z
    .string({ error: 'שם הוא שדה חובה' })
    .trim()
    .min(2, 'השם חייב להכיל לפחות 2 תווים')
    .max(50, 'השם יכול להכיל עד 50 תווים'),
  email,
  password: z
    .string({ error: 'סיסמה היא שדה חובה' })
    .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
    // bcrypt משתמש רק ב-72 הבתים הראשונים
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'הסיסמה ארוכה מדי (עד 72 תווים באנגלית)')
    .refine((value) => /[A-Za-z֐-׿]/.test(value), 'הסיסמה חייבת לכלול לפחות אות אחת')
    .refine((value) => /\d/.test(value), 'הסיסמה חייבת לכלול לפחות ספרה אחת'),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'סיסמה היא שדה חובה' }).min(1, 'סיסמה היא שדה חובה').max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
