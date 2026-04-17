import type {
  HunyuanStartRequestPayload,
  HunyuanStatusResponse,
} from '#src/types/3d.js';

const PIXAZO_BASE_URL = 'https://gateway.pixazo.ai/hunyuan3d-3-0-api-294/v1';
const HUNYUAN_3D_GENERATE_PATH = '/hunyuan3d-3-0-api-request';
const DEFAULT_FACE_COUNT = 500000;
const HUNYUAN_PROMPT_SUFFIX =
  'high-resolution 3D mesh, detailed geometry, complete 360-degree view.';

export const getPixazoBaseUrl = (): string => PIXAZO_BASE_URL;

export const getPixazoApiKey = (): string => {
  const apiKey = process.env.PIXAZO_API_KEY;

  if (!apiKey) {
    throw new Error('Missing PIXAZO_API_KEY in environment variables');
  }

  return apiKey;
};

export const buildHunyuanPrompt = (prompt: string = ''): string => {
  const normalized = prompt.trim();
  return normalized
    ? `${normalized} ${HUNYUAN_PROMPT_SUFFIX}`
    : HUNYUAN_PROMPT_SUFFIX;
};

export const buildHunyuanStartPayload = (
  imageUri: string,
  prompt: string = ''
): HunyuanStartRequestPayload => ({
  input_image_url: imageUri,
  prompt: buildHunyuanPrompt(prompt),
  face_count: DEFAULT_FACE_COUNT,
});

export const buildPixazoHeaders = (
  withJsonContentType = false
): Record<string, string> => {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': getPixazoApiKey(),
  };

  if (withJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const generate3DModelTryon = async (
  payload: HunyuanStartRequestPayload
): Promise<HunyuanStatusResponse> => {
  const url = `${getPixazoBaseUrl()}${HUNYUAN_3D_GENERATE_PATH}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Hunyuan job submission failed [${response.status}]: ${errorBody}`
    );
  }

  const data = (await response.json()) as HunyuanStatusResponse;

  if (!data.request_id || !data.polling_url) {
    throw new Error('Hunyuan response missing required fields');
  }

  return data;
};
