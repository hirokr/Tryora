import type {
  Hunyuan3DRequestPayload,
  Hunyuan3DStartResponse,
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
} from './utils.ts';

const PIXAZO_GENERATE_URL =
  'https://gateway.pixazo.ai/tripo3d-v2-5-413/v1/tripo3d-v2-5-request';

const HUNYUAN_3D_GENERATE_URL =
  'https://gateway.pixazo.ai/hunyuan3d-3-0-api-294/v1/hunyuan3d-3-0-api-request';

export const startHunyuan3DGeneration = async (
  imageUri: string,
  prompt = 'clean 3d model'
) => {
  if (!imageUri) {
    throw new Error('imageUri is required');
  }

  const payload = {
    input_image_url: imageUri,
    face_count: 40000,
    prompt,
  };

  const response = await fetch(HUNYUAN_3D_GENERATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPixazoHeaders(true),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log(data);

  if (!response.ok) {
    throw new Error(
      `Hunyuan3D submission failed [${response.status}]: ${JSON.stringify(data)}`
    );
  }

  if (!data?.request_id || !data?.polling_url) {
    throw new Error('Invalid API response: missing request_id or polling_url');
  }

  return data;
};

export const startTripo3DGeneration = async (
  imageUri: string
): Promise<TripoStatusResponse> => {
  const payload = buildTripoStartPayload(imageUri, '');
  console.log(payload);

  const response = await fetch(PIXAZO_GENERATE_URL, {
    method: 'POST',
    headers: buildPixazoHeaders(true),
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  console.log(rawBody);

  if (!response.ok) {
    // Now you get the actual Pixazo error message every time
    throw new Error(`Pixazo [${response.status}]: ${rawBody}`);
  }

  const data = JSON.parse(rawBody) as TripoStatusResponse;

  if (!data.request_id || !data.polling_url) {
    throw new Error('Invalid response: missing request_id or polling_url');
  }

  return {
    request_id: data.request_id,
    status: data.status,
    polling_url: data.polling_url,
  };
};

export const getTripoStatus = async (
  pollingUrl: string
): Promise<TripoResultResponse> => {
  const response = await fetch(pollingUrl, {
    method: 'GET',
    headers: buildPixazoHeaders(),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Status poll failed [${response.status}]: ${rawBody}`);
  }

  return JSON.parse(rawBody) as TripoResultResponse;
};

export const buildPixazoHeaders = (
  withJsonContentType = false
): Record<string, string> => {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': getPixazoApiKey(),
    'Cache-Control': 'no-cache',
  };

  if (withJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// export const generate3DModelTryon = async (
//   payload: TripoStartRequestPayload
// ): Promise<TripoStatusResponse> => {

//   const response = await fetch(PIXAZO_GENERATE_URL, {
//     method: 'POST',
//     headers: buildPixazoHeaders(true),
//     body: JSON.stringify(payload),
//   });
//   console.log('Response:', response);

//   if (response.status === 402) {
//     const errorBody = await response.text();
//     throw new Error(
//       `BILLING_ERROR [402]: ${errorBody}\n` +
//         `→ Check: https://api-console.pixazo.ai/dashboard\n` +
//         `→ Verify PIXAZO_API_KEY matches your funded account`
//     );
//   }

//   if (!response.ok) {
//     const errorBody = await response.text();
//     throw new Error(
//       `Tripo3D job submission failed [${response.status}]: ${errorBody}`
//     );
//   }

//   const data = (await response.json()) as TripoStatusResponse;

//   if (!data.request_id || !data.polling_url) {
//     throw new Error('Tripo3D response missing required fields');
//   }

//   return data;
// };
