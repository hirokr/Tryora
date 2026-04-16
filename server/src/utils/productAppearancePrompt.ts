const buildPatternSegment = (pattern?: string) => {
  const normalizedPattern = pattern?.trim();

  if (!normalizedPattern) {
    return 'with a clean, solid finish';
  }

  return `with a ${normalizedPattern} pattern`;
};

export const buildProductAppearancePrompt = (input: {
  productTitle: string;
  color: string;
  pattern?: string;
  customPrompt?: string;
}) => {
  const customPrompt = input.customPrompt?.trim();
  if (customPrompt) {
    return customPrompt;
  }

  const color = input.color.trim();
  const patternSegment = buildPatternSegment(input.pattern);

  return [
    `Edit this product photo of \"${input.productTitle}\".`,
    `Change the garment to ${color} ${patternSegment}.`,
    'Keep the product shape, lighting, background, camera angle, and fabric details realistic.',
    'Do not add text, logos, or extra objects.',
  ].join(' ');
};
