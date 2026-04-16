export type ClaidAiEditAspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '9:16'
  | '16:9'
  | '9:21'
  | '21:9';

export type ProductAppearanceEditInput = {
  color: string;
  pattern?: string;
  prompt?: string;
  model?: 'v1' | 'v2';
  aspectRatio?: ClaidAiEditAspectRatio;
  inferenceSteps?: number;
  guidanceScale?: number;
  format?: 'png' | 'jpeg';
};

export type ProductAppearanceEditApiRequest = {
  inputImage: string;
  prompt: string;
  model: 'v1' | 'v2';
  aspectRatio?: ClaidAiEditAspectRatio;
  inferenceSteps?: number;
  guidanceScale?: number;
  format: 'png' | 'jpeg';
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
