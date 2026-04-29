import type {
  TripoResultResponse,
  TripoStartRequestPayload,
  TripoStatusResponse,
} from '#src/types/3d.js';
import {
  buildTripoStartPayload,
  getPixazoApiKey,
  parseApiResponse,
  PIXAZO_3D_MODEL_PATH,
  PIXAZO_BASE_URL,
  PIXAZO_STATUS_ENDPOINT,
} from './utils.ts';

export const startTripo3DGeneration = async (
  imageUri: string,
  prompt: string = ''
): Promise<string> => {
  const url = `${PIXAZO_BASE_URL}/${PIXAZO_3D_MODEL_PATH}`;
  const payload = buildTripoStartPayload(imageUri, prompt);

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<TripoStatusResponse>(
    response,
    'Start API Error'
  );

  if (!data.request_id) {
    throw new Error('Invalid response: missing request ID');
  }

  return data.request_id;
};

export const getTripoStatus = async (
  requestId: string
): Promise<TripoResultResponse> => {
  const url = `${PIXAZO_STATUS_ENDPOINT}/${encodeURIComponent(requestId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildPixazoHeaders(),
  });

  return parseApiResponse<TripoResultResponse>(response, 'Status API Error');
};

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
  payload: TripoStartRequestPayload
): Promise<TripoStatusResponse> => {
  const url = `${PIXAZO_BASE_URL}${PIXAZO_3D_MODEL_PATH}`;

  console.debug('[Pixazo] POST', url);
  console.debug('[Pixazo] Payload:', JSON.stringify(payload));

  const response = await fetch(url, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });
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

  const data = (await response.json()) as TripoStatusResponse;

  if (!data.request_id || !data.polling_url) {
    throw new Error('Tripo3D response missing required fields');
  }

  return data;
};
