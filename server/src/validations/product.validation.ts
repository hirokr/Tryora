import { z } from 'zod/v3';

const IMAGE_AI_EDIT_MODELS = ['v1', 'v2'] as const;
const IMAGE_AI_EDIT_ASPECT_RATIOS = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
  '9:21',
  '21:9',
] as const;

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

export const editProductImageAppearanceSchema = z
  .object({
    color: z.string().trim().min(1, 'Color is required'),
    pattern: z.string().trim().min(1, 'Pattern cannot be empty').optional(),
    prompt: z.string().trim().min(1, 'Prompt cannot be empty').optional(),
    model: z.enum(IMAGE_AI_EDIT_MODELS).optional(),
    aspectRatio: z.enum(IMAGE_AI_EDIT_ASPECT_RATIOS).optional(),
    inferenceSteps: z
      .number()
      .int('inferenceSteps must be an integer')
      .min(1, 'inferenceSteps must be at least 1')
      .max(50, 'inferenceSteps must be at most 50')
      .optional(),
    guidanceScale: z
      .number()
      .min(1, 'guidanceScale must be at least 1')
      .max(10, 'guidanceScale must be at most 10')
      .optional(),
    format: z.enum(['png', 'jpeg']).optional(),
  })
  .superRefine((data, ctx) => {
    const model = data.model || 'v2';
    const hasV1OnlyOptions =
      data.aspectRatio !== undefined ||
      data.inferenceSteps !== undefined ||
      data.guidanceScale !== undefined;

    if (model !== 'v1' && hasV1OnlyOptions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['model'],
        message:
          'aspectRatio, inferenceSteps, and guidanceScale are supported only when model is v1.',
      });
    }
  });
