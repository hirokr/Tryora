import path from 'node:path';
import {
  removeBackgroundFromImageUrl, 
  RemoveBgResult,
} from 'remove.bg';

const API_KEY = process.env.REMOVEBG_API_KEY;
const LOCAL_OUTPUT_DIR = path.resolve(__dirname, '../../../assets/output');

export async function removeBackground(cloudImageUrl: string, userId: string) {
  try {
    const fileName = `user_id_${userId}.png`;
    const outputPath = path.join(LOCAL_OUTPUT_DIR, fileName);

    const result: RemoveBgResult = await removeBackgroundFromImageUrl({
      url: cloudImageUrl, 
      apiKey: API_KEY!,
      size: 'full',
      type: 'person',
      outputFile: outputPath, 
    });

    return { result, outputPath };
  } catch (errors) {
    console.error('Error:', JSON.stringify(errors));
    throw errors;
  }
}
