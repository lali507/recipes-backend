// =====================================================================
// Controllers – קטגוריות
// =====================================================================
import type { Request, Response } from 'express';
import { parseOrThrow } from '../../lib/validation';
import { currentUser } from '../../middleware/authorize';
import { categoryBodySchema, idParamSchema } from './categories.schemas';
import * as service from './categories.service';

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await service.listCategories(currentUser(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(categoryBodySchema, req.body);
  res.status(201).json(await service.createCategory(input));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const input = parseOrThrow(categoryBodySchema, req.body);
  res.json(await service.updateCategory(id, input));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  await service.deleteCategory(id);
  res.status(204).end();
}
