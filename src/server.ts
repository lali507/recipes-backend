// =====================================================================
// נקודת הכניסה: מפעיל את השרת על הפורט (PORT) שהענן מספק
// =====================================================================
import { createApp } from './app';
import { runBootstrap } from './bootstrap/bootstrap';
import { env } from './config/env';
import { prisma } from './db/prisma';

async function main(): Promise<void> {
  await prisma.$connect();
  await runBootstrap(prisma);

  const app = createApp();
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${env.PORT}`);
    console.log(`   Health:  http://localhost:${env.PORT}/api/health`);
    console.log(`   Swagger: http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received – shutting down`);
    server.close(() => {
      prisma
        .$disconnect()
        .catch(() => undefined)
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(async (error) => {
  console.error('❌ השרת לא הצליח לעלות:', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
