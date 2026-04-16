import fetch from 'node-fetch';
import {
  ProductAppearanceEditApiRequest,
  ProductAppearanceEditApiResult,
} from '#src/types/productImageEdit.js';

const CLAID_API_KEY = process.env.CLAID_API_KEY?.trim();
const CLAID_OUTPUT_DESTINATION = process.env.CLAID_OUTPUT_DESTINATION?.trim();
const CLAID_API_BASE_URL =
  process.env.CLAID_API_BASE_URL?.trim() || 'https://api.claid.ai';

type ClaidEditApiResponse = {
  data?: {
    output_url?: string;
  };
  output?: {
    images?: Array<{
      url?: string;
    }>;
    url?: string;
  };
};

const readOutputUrl = (payload: ClaidEditApiResponse): string | null => {
  return (
    payload.data?.output_url ||
    payload.output?.images?.[0]?.url ||
    payload.output?.url ||
    null
  );
};

export const editProductImageWithAi = async (
  input: ProductAppearanceEditApiRequest
): Promise<ProductAppearanceEditApiResult> => {
  if (!CLAID_API_KEY) {
    throw new Error('CLAID_API_KEY is not configured.');
  }

  const response = await fetch(`${CLAID_API_BASE_URL}/v1/image/ai-edit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      output: {
        number_of_images: 1,
        format: input.format,
        ...(CLAID_OUTPUT_DESTINATION
          ? { destination: CLAID_OUTPUT_DESTINATION }
          : {}),
      },
      input: input.inputImage,
      options: {
        model: input.model,
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
        inference_steps: input.inferenceSteps,
        guidance_scale: input.guidanceScale,
      },
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Product ai-edit failed: ${errorPayload}`);
  }

  const payload = (await response.json()) as ClaidEditApiResponse;
  const outputUrl = readOutputUrl(payload);

  if (!outputUrl) {
    throw new Error('AI edit response did not include output image URL.');
  }

  return { outputUrl };
};
