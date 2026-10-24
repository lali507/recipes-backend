// =====================================================================
// Authentication – בדיקה שהבקשה כוללת Bearer Token תקין
// המשתמש נטען ממסד הנתונים לפי המזהה שבתוך ה-Token בלבד.
// =====================================================================
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { unauthorized } from '../lib/errors';
import { verifyAccessToken } from '../lib/jwt';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header) {
    throw unauthorized('נדרשת התחברות. יש לשלוח Authorization: Bearer <token>', 'MISSING_TOKEN');
  }

  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    throw unauthorized('פורמט Authorization שגוי. יש לשלוח Bearer <token>', 'INVALID_TOKEN');
  }

  const userId = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    // למשל: המשתמש נמחק אחרי שקיבל Token
    throw unauthorized('המשתמש של ה-Token לא קיים', 'INVALID_TOKEN');
  }

  req.user = user;
  next();
}
