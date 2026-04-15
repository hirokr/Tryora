import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { mirrorGeneratedImageToOwnedStorage } from '#src/services/imageStorage.service.ts';

const CLAID_API_KEY = process.env.CLAID_API_KEY;

interface TryOnRequest {
  personImagePath: string;
  garmentImagePath: string;
  category?: 'tops' | 'bottoms' | 'full_body';
}

interface ClaidResponse {
  data: {
    output_url: string;
    // TODO: Add more fields as needed based on actual API response
  };
}

export async function generateTryOnImage({
  personImagePath,
  garmentImagePath,
  category = 'tops',
}: TryOnRequest): Promise<ClaidResponse> {
  try {
    const form = new FormData();

    // Attach images as ReadStreams
    form.append('person_image', fs.createReadStream(personImagePath));
    form.append('garment_image', fs.createReadStream(garmentImagePath));

    // Configs
    form.append('mode', 'try_on');
    form.append('category', category);
    form.append('output_format', 'png');

    const response = await fetch('https://api.claid.ai/v1/ai-fashion-models', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLAID_API_KEY}`,
        ...form.getHeaders(), // Required for FormData to set boundary
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${errText}`);
    }

    const claidResponse = (await response.json()) as ClaidResponse;
    const storedImage = await mirrorGeneratedImageToOwnedStorage({
      sourceUrl: claidResponse.data.output_url,
    });

    return {
      data: {
        output_url: storedImage.url,
      },
    };
  } catch (error) {
    console.error('Try-on generation failed:', error);
    throw error;
  }
}
