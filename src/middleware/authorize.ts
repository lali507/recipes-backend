// =====================================================================
// Authorization – בדיקת תפקיד המשתמש (USER / ADMIN)
// חייב לבוא אחרי authenticate.
// =====================================================================
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/enums';
import type { AuthUser } from '../types/express';
import { forbidden, unauthorized } from '../lib/errors';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw forbidden('פעולה זו מותרת למנהל בלבד');
    }
    next();
  };
}

/** מחזיר את המשתמש המחובר (לשימוש בתוך Controllers אחרי authenticate) */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user;
}
