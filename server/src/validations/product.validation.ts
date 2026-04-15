import { z } from 'zod/v3';

export const updateProductAppearanceSchema = z
  .object({
    colorTags: z
      .array(z.string().trim().min(1, 'Color tag cannot be empty'))
      .min(1, 'At least one color tag is required')
      .optional(),
    patternTags: z
      .array(z.string().trim().min(1, 'Pattern tag cannot be empty'))
      .min(1, 'At least one pattern tag is required')
      .optional(),
  })
  .refine(
    data => data.colorTags !== undefined || data.patternTags !== undefined,
    {
      message: 'At least one appearance field must be provided',
    }
  );
