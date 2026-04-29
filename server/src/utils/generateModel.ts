import type {
  HunyuanStartRequestPayload,
  HunyuanStatusResponse,
} from '#src/types/3d.js';

const TRIPO_BASE_URL =
  process.env.TRIPO_BASE_URL?.trim() ||
  'https://gateway.pixazo.ai/tripo3d-v2-5-413/v1';
const HUNYUAN_3D_GENERATE_PATH = '/tripo3d-v2-5-request';
const DEFAULT_TEXTURE = 'standard';
const DEFAULT_TEXTURE_ALIGNMENT = 'original_image';
const DEFAULT_ORIENTATION = 'default';

export const getPixazoBaseUrl = (): string => TRIPO_BASE_URL;

export const getPixazoApiKey = (): string => {
  // Use PIXAZO_API_KEY as the single source of truth
  const apiKey = process.env.PIXAZO_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'Missing PIXAZO_API_KEY. Get it from https://api-console.pixazo.ai/api_keys'
    );
  }

  return apiKey;
};

export const buildHunyuanPrompt = (_prompt: string = ''): string => '';

export const buildHunyuanStartPayload = (
  imageUri: string,
  _prompt: string = ''
): HunyuanStartRequestPayload => ({
  model: 'tripo3d-v2-5', // Add model field
  texture: DEFAULT_TEXTURE,
  texture_alignment: DEFAULT_TEXTURE_ALIGNMENT,
  orientation: DEFAULT_ORIENTATION,
  image_url: imageUri,
});

export const buildPixazoHeaders = (
  withJsonContentType = false
): Record<string, string> => {
  const apiKey = getPixazoApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`, // Primary auth
    'Ocp-Apim-Subscription-Key': apiKey, // APIM gateway fallback
    'Cache-Control': 'no-cache',
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

  console.debug('[Pixazo] POST', url);
  console.debug('[Pixazo] Payload:', JSON.stringify(payload));

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });
  console.log(response)

  if (response.status === 402) {
    const errorBody = await response.text();
    throw new Error(
      `BILLING_ERROR [402]: ${errorBody}\n` +
        `→ Check: https://api-console.pixazo.ai/dashboard\n` +
        `→ Verify PIXAZO_API_KEY matches your funded account`
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Tripo3D job submission failed [${response.status}]: ${errorBody}`
    );
  }

  const data = (await response.json()) as HunyuanStatusResponse;

  if (!data.request_id || !data.polling_url) {
    throw new Error('Tripo3D response missing required fields');
  }

  return data;
};
