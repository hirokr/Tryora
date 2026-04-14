import type {
  HunyuanStartResponse,
  HunyuanStatusResponse,
} from '#src/types/3d.js';
import {
  buildHunyuanStartPayload,
  buildPixazoHeaders,
  getPixazoBaseUrl,
} from '#src/utils/generate3D.ts';

const HUNYUAN_START_ENDPOINT = 'hunyuan3d-3-0-api-request';

const parseApiResponse = async <T>(
  response: Response,
  errorPrefix: string
): Promise<T> => {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${errorPrefix} ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
};

export const startHunyuan3DGeneration = async (
  imageUri: string,
  prompt: string = ''
): Promise<string> => {
  const url = `${getPixazoBaseUrl()}/${HUNYUAN_START_ENDPOINT}`;
  const payload = buildHunyuanStartPayload(imageUri, prompt);

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<HunyuanStartResponse>(
    response,
    'Start API Error'
  );

  if (!data.id) {
    throw new Error('Invalid response: missing job ID');
  }

  return data.id;
};

export const getHunyuanStatus = async (
  jobId: string
): Promise<HunyuanStatusResponse> => {
  const url = `${getPixazoBaseUrl()}/${HUNYUAN_START_ENDPOINT}/${jobId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPixazoHeaders(),
  });

  return parseApiResponse<HunyuanStatusResponse>(response, 'Status API Error');
};
