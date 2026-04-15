export type GeneratedImageStorageInput = {
  sourceUrl: string;
};

export type GeneratedImageStorageResult = {
  provider: 'uploadthing' | 's3';
  key: string;
  url: string;
};

export type S3Config = {
  endpoint?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};
