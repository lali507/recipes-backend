// =====================================================================
// סכמות ולידציה משותפות
// =====================================================================
import { z } from 'zod';

const positiveId = (label: string) =>
  z.coerce
    .number({ error: `${label} חייב להיות מספר` })
    .int(`${label} חייב להיות מספר שלם`)
    .positive(`${label} חייב להיות מספר חיובי`)
    .max(2_147_483_647, `${label} גדול מדי`);

export const idParamSchema = z.object({ id: positiveId('המזהה') });
export const recipeIdParamSchema = z.object({ recipeId: positiveId('מזהה המתכון') });
export { positiveId };
