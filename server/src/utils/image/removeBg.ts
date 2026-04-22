import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeBackgroundFromImageUrl, RemoveBgResult } from 'remove.bg';

const API_KEY = process.env.REMOVEBG_API_KEY;
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_OUTPUT_DIR = path.resolve(CURRENT_DIR, '../../../assets/output');

export async function removeBackground(cloudImageUrl: string, userId: string) {
  try {
    if (!API_KEY) {
      throw new Error('Missing REMOVEBG_API_KEY in environment variables');
    }

    await fs.mkdir(LOCAL_OUTPUT_DIR, { recursive: true });

    const fileName = `user_id_${userId}_${randomUUID()}.png`;
    const outputPath = path.join(LOCAL_OUTPUT_DIR, fileName);

    const result: RemoveBgResult = await removeBackgroundFromImageUrl({
      url: cloudImageUrl,
      apiKey: API_KEY,
      size: 'full',
      type: 'person',
      outputFile: outputPath,
    });

    return { result, outputPath };
  } catch (error) {
    console.error('Error:', JSON.stringify(error));
    throw error;
  }
}
