// =====================================================================
// Routes – /api/favorites  (כל הנתיבים דורשים התחברות)
// =====================================================================
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './favorites.controller';

export function createFavoritesRouter(): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', controller.list);
  router.post('/:recipeId', controller.add);
  router.delete('/:recipeId', controller.remove);

  return router;
}
