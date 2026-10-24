// =====================================================================
// הצפנת סיסמאות (Hash) עם bcrypt
// הסיסמה המקורית לעולם לא נשמרת במסד הנתונים.
// =====================================================================
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Hash קבוע להשוואה כשהמשתמש לא קיים – כדי שזמן התגובה יהיה דומה
// ולא ניתן יהיה לגלות אילו אימיילים רשומים במערכת.
let dummyHashPromise: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash('dummy-password-for-timing', env.BCRYPT_ROUNDS);
  return dummyHashPromise;
}
