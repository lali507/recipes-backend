// =====================================================================
// Routes – /api/recipes  (כל הנתיבים דורשים התחברות)
// =====================================================================
import { Router } from 'express';
import type { ImageStorage } from '../../lib/imageStorage';
import { authenticate } from '../../middleware/authenticate';
import { createRecipesController } from './recipes.controller';

export function createRecipesRouter(storage: ImageStorage): Router {
  const router = Router();
  const controller = createRecipesController(storage);

  router.use(authenticate);

  router.get('/', controller.listPublic);
  // חשוב: /mine ו-/authors לפני /:id, אחרת הם ייחשבו כמזהה
  router.get('/mine', controller.listMine);
  router.get('/authors', controller.listAuthors);
  router.get('/:id', controller.getOne);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  router.post('/:id/image', controller.checkImageUpload, controller.receiveImage, controller.uploadImage);
  router.delete('/:id/image', controller.removeImage);

  return router;
}
