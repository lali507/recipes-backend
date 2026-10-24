// רץ פעם אחת לפני כל הבדיקות: מעדכן את מסד הנתונים לבדיקות לפי ה-Migrations
import { execSync } from 'node:child_process';
import { loadTestEnv } from './loadTestEnv';

export default function setup(): void {
  loadTestEnv();
  if (process.env.TEST_SKIP_MIGRATE === '1') {
    return;
  }
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
