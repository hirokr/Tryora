import 'dotenv/config';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

type UploadResult = Awaited<ReturnType<typeof utapi.uploadFilesFromUrl>>;


export async function handleUrlUpload(productUrl: string, fileName: string): Promise<UploadResult> {
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



// handleUrlUpload('https://avatars.githubusercontent.com/u/117710065?v=4', 'profile-image.png');
