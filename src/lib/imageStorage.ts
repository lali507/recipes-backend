// =====================================================================
// אחסון תמונות בענן (Cloudinary)
// השרת מקבל קובץ, מעלה אותו ל-Cloudinary ושומר רק את הקישור.
// ממשק (interface) נפרד מאפשר להחליף את הספק בבדיקות או בעתיד.
// =====================================================================
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';

export type StoredImage = { url: string; publicId: string };

export interface ImageStorage {
  /** האם השירות הוגדר (יש מפתחות) */
  isConfigured(): boolean;
  upload(file: Buffer, mimeType: string): Promise<StoredImage>;
  delete(publicId: string): Promise<void>;
}

export function createCloudinaryStorage(): ImageStorage {
  const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

  if (configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  return {
    isConfigured: () => configured,

    upload(file: Buffer): Promise<StoredImage> {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: env.CLOUDINARY_FOLDER,
            resource_type: 'image',
            // הקטנה אוטומטית של תמונות גדולות מאוד
            transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              reject(error ?? new Error('Cloudinary upload failed'));
              return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        );
        stream.end(file);
      });
    },

    async delete(publicId: string): Promise<void> {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    },
  };
}

/** בדיקת "חתימת" הקובץ – מוודא שזו באמת תמונה ולא רק שם קובץ שמסתיים ב-jpg */
export function detectImageType(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}
