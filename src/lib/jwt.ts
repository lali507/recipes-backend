// =====================================================================
// יצירה ואימות של JWT Access Token
// =====================================================================
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from './errors';
import type { Role } from '../generated/prisma/enums';

export type TokenPayload = { sub: string; role: Role };

const ALGORITHM = 'HS256' as const;

export function signAccessToken(user: { id: number; role: Role }): string {
  const options: SignOptions = {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    subject: String(user.id),
  };
  return jwt.sign({ role: user.role }, env.JWT_SECRET, options);
}

/** מחזיר את מזהה המשתמש מתוך ה-Token, או זורק שגיאת 401 */
export function verifyAccessToken(token: string): number {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
    if (typeof decoded === 'string' || !decoded.sub) {
      throw unauthorized('ה-Token אינו תקין', 'INVALID_TOKEN');
    }
    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw unauthorized('ה-Token אינו תקין', 'INVALID_TOKEN');
    }
    return userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized('פג תוקף ההתחברות, יש להתחבר מחדש', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.NotBeforeError) {
      throw unauthorized('ה-Token אינו תקין', 'INVALID_TOKEN');
    }
    throw error;
  }
}
