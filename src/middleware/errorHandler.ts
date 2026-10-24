// =====================================================================
// טיפול מרכזי בשגיאות – כל שגיאה הופכת לתשובת JSON מסודרת
// =====================================================================
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { isProduction, isTest } from '../config/env';

type ErrorBody = { error: { code: string; message: string; details?: unknown } };

function send(res: Response, status: number, body: ErrorBody): void {
  res.status(status).json(body);
}

export function notFoundHandler(req: Request, res: Response): void {
  send(res, 404, {
    error: { code: 'ROUTE_NOT_FOUND', message: `הנתיב ${req.method} ${req.path} לא קיים` },
  });
}

// ב-Express חייבים ארבעה פרמטרים כדי שהפונקציה תזוהה כ-Error Handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    send(res, err.status, {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // שגיאות העלאת קבצים
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      send(res, 413, { error: { code: 'FILE_TOO_LARGE', message: 'הקובץ גדול מדי. הגודל המקסימלי הוא 5MB' } });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      send(res, 400, {
        error: { code: 'BAD_REQUEST', message: 'יש לשלוח קובץ אחד בשדה בשם image' },
      });
      return;
    }
    send(res, 400, { error: { code: 'BAD_REQUEST', message: 'שגיאה בהעלאת הקובץ' } });
    return;
  }

  // JSON לא תקין או גוף בקשה גדול מדי (מגיע מ-express.json)
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type?: string }).type;
    if (type === 'entity.parse.failed') {
      send(res, 400, { error: { code: 'INVALID_JSON', message: 'גוף הבקשה אינו JSON תקין' } });
      return;
    }
    if (type === 'entity.too.large') {
      send(res, 413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'גוף הבקשה גדול מדי' } });
      return;
    }
  }

  // שגיאות מוכרות של Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      send(res, 409, { error: { code: 'CONFLICT', message: 'ערך זה כבר קיים במערכת' } });
      return;
    }
    if (err.code === 'P2025') {
      send(res, 404, { error: { code: 'NOT_FOUND', message: 'המשאב המבוקש לא נמצא' } });
      return;
    }
    if (err.code === 'P2003') {
      send(res, 409, { error: { code: 'CONFLICT', message: 'הפעולה מתנגשת בנתונים קשורים' } });
      return;
    }
  }

  // שגיאה לא צפויה – לא חושפים פרטים פנימיים ללקוח
  if (!isTest) {
    console.error('Unexpected error:', err);
  }
  send(res, 500, {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'אירעה שגיאה בשרת',
      ...(!isProduction && !isTest && err instanceof Error ? { details: err.message } : {}),
    },
  });
}
