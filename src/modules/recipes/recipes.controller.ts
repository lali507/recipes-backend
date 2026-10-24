// =====================================================================
// Controllers – מתכונים
// =====================================================================
import type { NextFunction, Request, Response } from 'express';
import { idParamSchema } from '../../lib/commonSchemas';
import type { ImageStorage } from '../../lib/imageStorage';
import { parseOrThrow } from '../../lib/validation';
import { currentUser } from '../../middleware/authorize';
import { imageUpload } from '../../middleware/upload';
import { createRecipeSchema, myRecipesQuerySchema, recipeListQuerySchema, updateRecipeSchema } from './recipes.schemas';
import * as service from './recipes.service';

export function createRecipesController(storage: ImageStorage) {
  return {
    async listPublic(req: Request, res: Response) {
      const query = parseOrThrow(recipeListQuerySchema, req.query);
      res.json(await service.listPublicRecipes(currentUser(req), query));
    },

    async listMine(req: Request, res: Response) {
      const query = parseOrThrow(myRecipesQuerySchema, req.query);
      res.json(await service.listMyRecipes(currentUser(req), query));
    },

    async getOne(req: Request, res: Response) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      res.json(await service.getRecipe(currentUser(req), id));
    },

    async create(req: Request, res: Response) {
      const input = parseOrThrow(createRecipeSchema, req.body);
      res.status(201).json(await service.createRecipe(currentUser(req), input));
    },

    async update(req: Request, res: Response) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      const input = parseOrThrow(updateRecipeSchema, req.body);
      res.json(await service.updateRecipe(currentUser(req), id, input));
    },

    async remove(req: Request, res: Response) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      await service.deleteRecipe(currentUser(req), id, storage);
      res.status(204).end();
    },

    /** שלב 1: בדיקת הרשאה לפני קריאת הקובץ (כדי לא לקבל קבצים מיותרים) */
    async checkImageUpload(req: Request, _res: Response, next: NextFunction) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      await service.assertCanUploadImage(currentUser(req), id, storage);
      next();
    },

    /** שלב 2: קבלת הקובץ (multer) */
    receiveImage: imageUpload,

    /** שלב 3: העלאה ל-Cloudinary ועדכון המתכון */
    async uploadImage(req: Request, res: Response) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      res.json(await service.setRecipeImage(currentUser(req), id, req.file, storage));
    },

    async removeImage(req: Request, res: Response) {
      const { id } = parseOrThrow(idParamSchema, req.params);
      res.json(await service.removeRecipeImage(currentUser(req), id, storage));
    },
  };
}
