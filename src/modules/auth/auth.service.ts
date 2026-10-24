// =====================================================================
// לוגיקה עסקית של התחברות והרשמה
// =====================================================================
import { prisma } from '../../db/prisma';
import { conflict, unauthorized } from '../../lib/errors';
import { signAccessToken } from '../../lib/jwt';
import { getDummyHash, hashPassword, verifyPassword } from '../../lib/password';
import type { LoginInput, RegisterInput } from './auth.schemas';

// השדות שמותר להחזיר ללקוח – בלי passwordHash!
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw conflict('כתובת האימייל כבר רשומה במערכת', 'EMAIL_TAKEN');
  }

  // ההרשמה יוצרת תמיד משתמש רגיל. אי אפשר להירשם כמנהל.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'USER',
    },
    select: publicUserSelect,
  });

  return { token: signAccessToken(user), user };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // משווים גם כשהמשתמש לא קיים, כדי לא לחשוף אילו אימיילים רשומים
  const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordOk) {
    throw unauthorized('אימייל או סיסמה שגויים', 'INVALID_CREDENTIALS');
  }

  const { passwordHash: _omit, updatedAt: _u, ...safeUser } = user;
  return { token: signAccessToken(user), user: safeUser };
}

export async function getMe(userId: number) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
}
