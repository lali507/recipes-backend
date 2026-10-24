// =====================================================================
// Routes – /api/auth
// =====================================================================
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './auth.controller';

export type AuthRateLimiters = { login: RequestHandler; register: RequestHandler };

export function createAuthRouter(limiters: AuthRateLimiters): Router {
  const router = Router();

  router.post('/register', limiters.register, controller.register);
  router.post('/login', limiters.login, controller.login);
  router.get('/me', authenticate, controller.me);

  return router;
}
