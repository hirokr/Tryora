import type { HunyuanStartRequestPayload } from '#src/types/3d.js';

const PIXAZO_BASE_URL = 'https://gateway.pixazo.ai/hunyuan3d-3-0-api-294/v1';
const DEFAULT_FACE_COUNT = 500000;
const HUNYUAN_PROMPT_SUFFIX =
  'high-resolution 3D mesh, detailed geometry, complete 360-degree view.';

export const getPixazoBaseUrl = () => PIXAZO_BASE_URL;

export const getPixazoApiKey = () => {
  const apiKey = process.env.PIXAZO_API_KEY;

  if (!apiKey) {
    throw new Error('Missing PIXAZO_API_KEY in environment variables');
  }

  return apiKey;
};

export const buildHunyuanPrompt = (prompt: string = '') => {
  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    return HUNYUAN_PROMPT_SUFFIX;
  }

  return `${normalizedPrompt} ${HUNYUAN_PROMPT_SUFFIX}`;
};

export const buildHunyuanStartPayload = (
  imageUri: string,
  prompt: string = ''
): HunyuanStartRequestPayload => ({
  input_image_url: imageUri,
  prompt: buildHunyuanPrompt(prompt),
  face_count: DEFAULT_FACE_COUNT,
});

export const buildPixazoHeaders = (withJsonContentType: boolean = false) => {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': getPixazoApiKey(),
  };

  if (withJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};
