import 'dotenv/config';
import { UTApi } from 'uploadthing/server';
import fs from 'node:fs/promises';

const utapi = new UTApi();

type UploadResult = Awaited<ReturnType<typeof utapi.uploadFilesFromUrl>>;

export async function handleUrlUpload(
  productUrl: string,
  fileName: string
): Promise<UploadResult> {
  try {
    const response = await utapi.uploadFilesFromUrl({
      url: productUrl,
      name: fileName,
    });

    return [response];
  } catch (error) {
    throw error;
  }
}

export async function handleFileUpload(
  fileName: string,
  filePath: string
): Promise<UploadResult> {
  const buffer = await fs.readFile(filePath);

  const file = new File([buffer], fileName, { type: 'image/png' });

  const response = await utapi.uploadFiles(file);
  return [response];
}

// handleUrlUpload('https://avatars.githubusercontent.com/u/117710065?v=4', 'profile-image.png');
