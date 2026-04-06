import { z } from 'zod';
import { ID } from './_shared';

export const materialDeleteSchema = z.object({
  id: ID,
});
