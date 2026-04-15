import { z } from 'zod/v3';

const productIdListSchema = z
  .array(z.string().trim().min(1, 'Product id cannot be empty'))
  .min(1, 'At least one product id is required');

export const createTryOnImagesSchema = z
  .object({
    productIds: productIdListSchema.optional(),
    productIdeas: productIdListSchema.optional(),
    bodyImageId: z
      .string()
      .trim()
      .min(1, 'bodyImageId cannot be empty')
      .optional(),
    poseImageUrl: z
      .string()
      .trim()
      .url('poseImageUrl must be a valid URL')
      .optional(),
    poser: z.enum(['front', 'side', 'back']).optional(),
    category: z.enum(['tops', 'bottoms', 'full_body']).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.productIds && !value.productIdeas) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide at least one product id in productIds or productIdeas',
        path: ['productIds'],
      });
    }
  })
  .transform(value => ({
    productIds: [...(value.productIds || []), ...(value.productIdeas || [])],
    bodyImageId: value.bodyImageId,
    poseImageUrl: value.poseImageUrl,
    poser: value.poser || 'front',
    category: value.category,
  }));

export type CreateTryOnImagesInput = z.infer<typeof createTryOnImagesSchema>;
