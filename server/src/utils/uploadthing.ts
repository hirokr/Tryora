import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter: FileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .onUploadError(() => {
      throw new Error(
        `Upload failed. Please ensure your file is an image and less than 4MB in size.`
      );
    })
    .onUploadComplete(data => {
      console.log('upload completed', data);
    }),
};

export type OurFileRouter = typeof uploadRouter;
