// =====================================================================
// קבלת קובץ תמונה אחד (שדה בשם image) לזיכרון, עד 5MB
// =====================================================================
import multer from 'multer';
import { AppError } from '../lib/errors';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, callback) => {
    if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'סוג הקובץ אינו נתמך. מותר: JPG, PNG, WEBP'));
  },
}).single('image');
