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

export const editProductImageAppearanceSchema = z.object({
  color: z.string().trim().min(1, 'Color is required'),
  pattern: z.string().trim().min(1, 'Pattern cannot be empty').optional(),
  prompt: z.string().trim().min(1, 'Prompt cannot be empty').optional(),
  model: z.string().trim().min(1, 'Model cannot be empty').optional(),
  aspectRatio: z
    .string()
    .trim()
    .regex(
      /^\d+:\d+$/,
      'aspectRatio must be in format width:height (for example 1:1)'
    )
    .optional(),
  inferenceSteps: z
    .number()
    .int('inferenceSteps must be an integer')
    .min(1, 'inferenceSteps must be at least 1')
    .max(60, 'inferenceSteps must be at most 60')
    .optional(),
  guidanceScale: z
    .number()
    .min(1, 'guidanceScale must be at least 1')
    .max(30, 'guidanceScale must be at most 30')
    .optional(),
  format: z.enum(['png', 'jpeg', 'webp']).optional(),
});
