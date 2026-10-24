// =====================================================================
// שגיאות HTTP מסודרות
// כל שגיאה שהשרת מחזיר בנויה כך:
// { "error": { "code": "...", "message": "...", "details": [...] } }
// =====================================================================

export type ErrorDetail = { field: string; message: string };

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: ErrorDetail[]) =>
  new AppError(400, 'BAD_REQUEST', message, details);

export const validationError = (details: ErrorDetail[]) =>
  new AppError(400, 'VALIDATION_ERROR', 'הנתונים שנשלחו אינם תקינים', details);

export const unauthorized = (message = 'נדרשת התחברות', code = 'UNAUTHORIZED') =>
  new AppError(401, code, message);

export const forbidden = (message = 'אין לך הרשאה לבצע פעולה זו') => new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'המשאב המבוקש לא נמצא') => new AppError(404, 'NOT_FOUND', message);

export const conflict = (message: string, code = 'CONFLICT') => new AppError(409, code, message);

export const serviceUnavailable = (message: string, code = 'SERVICE_UNAVAILABLE') =>
  new AppError(503, code, message);
