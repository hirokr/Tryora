import { describe, expect, it } from '@jest/globals';
import { editProductImageAppearanceSchema } from '#src/validations/product.validation.ts';

describe('product ai-edit validation schema', () => {
  it('accepts minimal valid payload', () => {
    const result = editProductImageAppearanceSchema.parse({
      color: 'black',
    });

    expect(result).toEqual({ color: 'black' });
  });

  it('rejects unsupported output format', () => {
    const parsed = editProductImageAppearanceSchema.safeParse({
      color: 'black',
      format: 'webp',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects unsupported aspect ratio value', () => {
    const parsed = editProductImageAppearanceSchema.safeParse({
      color: 'black',
      model: 'v1',
      aspectRatio: '10:1',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects v2 payload when v1-only options are provided', () => {
    const parsed = editProductImageAppearanceSchema.safeParse({
      color: 'black',
      model: 'v2',
      inferenceSteps: 30,
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects v2-default payload when v1-only options are provided', () => {
    const parsed = editProductImageAppearanceSchema.safeParse({
      color: 'black',
      guidanceScale: 7,
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts v1 payload with v1-only options in valid range', () => {
    const parsed = editProductImageAppearanceSchema.safeParse({
      color: 'black',
      model: 'v1',
      aspectRatio: '1:1',
      inferenceSteps: 50,
      guidanceScale: 10,
      format: 'jpeg',
    });

    expect(parsed.success).toBe(true);
  });
});
