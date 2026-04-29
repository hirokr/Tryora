import { TripoStartRequestPayload } from '#src/types/3d.js';

export const PIXAZO_BASE_URL =
  process.env.PIXAZO_BASE_URL || 'https://gateway.pixazo.ai/v2';
export const DEFAULT_TEXTURE = 'standard';
export const DEFAULT_TEXTURE_ALIGNMENT = 'original_image';
export const DEFAULT_ORIENTATION = 'default';

export const PIXAZO_3D_MODEL_PATH =
  process.env.PIXAZO_3D_MODEL_PATH || '/tripo3d-v2-5-request';

// PIXAZO_STATUS_ENDPOINT removed — polling now uses the polling_url
// returned directly from the job submission response.

export const getPixazoApiKey = (): string => {
  const apiKey = process.env.PIXAZO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing PIXAZO_API_KEY. Get it from https://api-console.pixazo.ai/api_keys'
    );
  }
  return apiKey;
};

export const buildTripoPrompt = (_prompt: string = ''): string => '';

export const buildTripoStartPayload = (
  imageUri: string,
  _prompt: string = ''
): TripoStartRequestPayload => ({
  model: 'tripo3d-v2-5',
  texture: DEFAULT_TEXTURE,
  texture_alignment: DEFAULT_TEXTURE_ALIGNMENT,
  orientation: DEFAULT_ORIENTATION,
  image_url: imageUri,

  face_limit: 10_000, 
  auto_refine: false, 
  texture_quality: 'low', // 'low' | 'standard' | 'high'
});
export const parseApiResponse = async <T>(
  response: Response,
  errorPrefix: string
): Promise<T> => {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${errorPrefix} ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
};
