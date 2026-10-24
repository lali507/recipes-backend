// =====================================================================
// Routes – /api/categories
// צפייה: כל משתמש מחובר. הוספה, עריכה ומחיקה: מנהל בלבד.
// =====================================================================
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import * as controller from './categories.controller';

export function createCategoriesRouter(): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', controller.list);
  router.post('/', requireRole('ADMIN'), controller.create);
  router.put('/:id', requireRole('ADMIN'), controller.update);
  router.delete('/:id', requireRole('ADMIN'), controller.remove);

  return router;
}
