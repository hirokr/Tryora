interface Hunyuan3DResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model_urls?: {
    glb?: string;
    obj?: string;
  };
  error?: string;
}
const PIXAZO_API_KEY = process.env.PIXAZO_API_KEY;
if (!PIXAZO_API_KEY) {
  throw new Error('Missing PIXAZO_API_KEY in environment variables');
}
const RESOLVED_PIXAZO_API_KEY: string = PIXAZO_API_KEY;

export async function startHunyuan3DGeneration(
  imageUri: string,
  prompt: string,
): Promise<Hunyuan3DResponse> {
  const url =
    'https://gateway.pixazo.ai/hunyuan3d-3-0-api-294/v1/hunyuan3d-3-0-api-request';

  const payload = {
    input_image_url: imageUri,
    prompt: prompt,
    face_count: 500000,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': RESOLVED_PIXAZO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result: Hunyuan3DResponse = await response.json();
    console.log('Generation started. Task ID:', result.task_id);
    return result;
  } catch (error) {
    console.error('Failed to trigger 3D generation:', error);
    throw error;
  }
}
