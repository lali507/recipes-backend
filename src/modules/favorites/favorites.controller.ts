// =====================================================================
// Controllers – מועדפים
// =====================================================================
import type { Request, Response } from 'express';
import { recipeIdParamSchema } from '../../lib/commonSchemas';
import { parseOrThrow } from '../../lib/validation';
import { currentUser } from '../../middleware/authorize';
import { paginationSchema } from '../recipes/recipes.schemas';
import * as service from './favorites.service';

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseOrThrow(paginationSchema, req.query);
  res.json(await service.listFavorites(currentUser(req), query));
}

export async function add(req: Request, res: Response): Promise<void> {
  const { recipeId } = parseOrThrow(recipeIdParamSchema, req.params);
  const created = await service.addFavorite(currentUser(req), recipeId);
  res.status(created ? 201 : 200).json({ recipeId, isFavorite: true });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { recipeId } = parseOrThrow(recipeIdParamSchema, req.params);
  await service.removeFavorite(currentUser(req), recipeId);
  res.status(204).end();
}
