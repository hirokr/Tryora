export type ProductAppearanceEditInput = {
  color: string;
  pattern?: string;
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  inferenceSteps?: number;
  guidanceScale?: number;
  format?: 'png' | 'jpeg' | 'webp';
};

export type ProductAppearanceEditApiRequest = {
  inputImage: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  inferenceSteps: number;
  guidanceScale: number;
  format: 'png' | 'jpeg' | 'webp';
};

export type ProductAppearanceEditApiResult = {
  outputUrl: string;
};

export type ProductImageSummary = {
  id: string;
  url: string;
};

export type UpdatedProductForAppearanceEdit = {
  id: string;
  title: string;
  image: string;
  productUrl: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  colorTags: unknown;
  patternTags: unknown;
  processedImageUrl: string | null;
  images: ProductImageSummary[];
};

export type ProductAppearanceEditResult = {
  message: string;
  defaultImageUrl: string;
  product: UpdatedProductForAppearanceEdit;
};
