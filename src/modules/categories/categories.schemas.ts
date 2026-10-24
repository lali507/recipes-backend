// =====================================================================
// ולידציה לקטגוריות
// =====================================================================
import { z } from 'zod';

export const categoryBodySchema = z.object({
  name: z
    .string({ error: 'שם הקטגוריה הוא שדה חובה' })
    .trim()
    .min(2, 'שם הקטגוריה חייב להכיל לפחות 2 תווים')
    .max(40, 'שם הקטגוריה יכול להכיל עד 40 תווים'),
});

export { idParamSchema } from '../../lib/commonSchemas';

export type CategoryBody = z.infer<typeof categoryBodySchema>;
