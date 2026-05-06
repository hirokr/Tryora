import { TripoStartRequestPayload } from '#src/types/3d.js';

export const PIXAZO_BASE_URL =
  process.env.PIXAZO_BASE_URL || 'https://gateway.pixazo.ai/v2';

export const PIXAZO_3D_MODEL_PATH =
  process.env.PIXAZO_3D_MODEL_PATH || '/tripo3d-v2-5-request';

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
  texture: 'standard',
  texture_alignment: 'original_image',
  orientation: 'default',
  image_url: imageUri,
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
