// =====================================================================
// GET /api/health – בדיקה שהשרת ומסד הנתונים פעילים
// =====================================================================
import { Router } from 'express';
import { prisma } from '../../db/prisma';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const base = { uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() };
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'ok', ...base });
    } catch {
      res.status(503).json({ status: 'error', database: 'unreachable', ...base });
    }
  });

  return router;
}
