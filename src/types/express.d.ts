// הרחבת הטיפוס של Request ב-Express כך שיכלול את המשתמש המחובר
import type { Role } from '../generated/prisma/enums';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      /** המשתמש המחובר – נקבע אך ורק לפי ה-Token */
      user?: AuthUser;
    }
  }
}
