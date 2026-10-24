// =====================================================================
// בניית אפליקציית Express: אבטחה, CORS, Routes, Swagger וטיפול בשגיאות
// =====================================================================
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { corsOrigins, env, isProduction } from './config/env';
import { openApiDocument } from './docs/openapi';
import { createCloudinaryStorage, type ImageStorage } from './lib/imageStorage';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createCategoriesRouter } from './modules/categories/categories.routes';
import { createFavoritesRouter } from './modules/favorites/favorites.routes';
import { createHealthRouter } from './modules/health/health.routes';
import { createRecipesRouter } from './modules/recipes/recipes.routes';

export type AppOptions = {
  imageStorage?: ImageStorage;
  authRateLimitMax?: number;
};

function buildCorsOptions(): CorsOptions {
  return {
    origin: (origin, callback) => {
      // בקשות בלי Origin (Swagger מאותו שרת, curl, Postman) – מותרות
      if (!origin || corsOrigins === '*' || corsOrigins.includes(origin.replace(/\/+$/, ''))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
}

function authLimiter(max: number, skipSuccessfulRequests: boolean) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'TOO_MANY_REQUESTS', message: 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות' },
      });
    },
  });
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const imageStorage = options.imageStorage ?? createCloudinaryStorage();
  const rateMax = options.authRateLimitMax ?? env.AUTH_RATE_LIMIT_MAX;

  app.disable('x-powered-by');
  // בענן (Render) השרת יושב מאחורי Proxy – נדרש כדי לזהות את כתובת ה-IP האמיתית
  if (isProduction) app.set('trust proxy', 1);

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '100kb' }));

  // ---------------- Swagger ----------------
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api-docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'Recipes API – Swagger',
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true, validatorUrl: null },
    }),
  );

  // ---------------- API ----------------
  app.use('/api', helmet());
  app.use('/api/health', createHealthRouter());
  app.use(
    '/api/auth',
    createAuthRouter({ login: authLimiter(rateMax, true), register: authLimiter(rateMax, false) }),
  );
  app.use('/api/categories', createCategoriesRouter());
  app.use('/api/recipes', createRecipesRouter(imageStorage));
  app.use('/api/favorites', createFavoritesRouter());

  // דף פתיחה קטן בכתובת הראשית
  app.get('/', (_req, res) => {
    res.json({ name: 'Recipes API', docs: '/api-docs', health: '/api/health' });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
