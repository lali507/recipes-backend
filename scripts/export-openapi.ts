// יוצר את הקובץ docs/openapi.json מתוך מסמך ה-OpenAPI שבקוד
// הרצה: npm run openapi:export
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openApiDocument } from '../src/docs/openapi';

const outDir = join(__dirname, '..', 'docs');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'openapi.json');
writeFileSync(outFile, JSON.stringify(openApiDocument, null, 2) + '\n', 'utf8');
console.log(`✅ נוצר ${outFile}`);
