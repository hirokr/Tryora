import {
  removeBackgroundFromImageFile,
  RemoveBgResult,
  RemoveBgError,
} from 'remove.bg';

const API_KEY = process.env.REMOVEBG_API_KEY;
if (!API_KEY) {
  throw new Error('Missing REMOVEBG_API_KEY in environment variables');
}
const RESOLVED_API_KEY: string = API_KEY;

export async function removeBackground(inputPath: string, outputPath: string) {
  try {
    const result: RemoveBgResult = await removeBackgroundFromImageFile({
      path: inputPath,
      apiKey: RESOLVED_API_KEY,
      size: 'full', // Options: preview, full, auto
      type: 'person', 
      outputFile: outputPath,
    });

    return result;
  } catch (errors) {
    const errs = errors as Array<RemoveBgError>;
    console.error('Error:', JSON.stringify(errs));
    throw errors;
  }
}
