import { createHash } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { UTApi, UTFile } from 'uploadthing/server';
import logger from '#src/config/logger.ts';
import {
  GeneratedImageStorageInput,
  GeneratedImageStorageResult,
  S3Config,
} from '#src/types/image.js';

const IMAGE_STORAGE_PREFIX = 'generated-images';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const sanitizePathSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const getUploadThingToken = () => {
  const token = process.env.UPLOADTHING_TOKEN?.trim();

  if (!token) {
    throw new Error('Missing UPLOADTHING_TOKEN in environment variables');
  }

  return token;
};

const normalizeRegion = (value: string | undefined) => {
  if (!value) {
    return 'auto';
  }

  const trimmed = value.trim();

  if (!trimmed || /\s|\(|\)/.test(trimmed)) {
    return 'auto';
  }

  return trimmed;
};

const getS3Config = (): S3Config => {
  const bucket =
    process.env.AWS_S3_BUCKET?.trim() || process.env.R2_BUCKET?.trim() || '';

  if (!bucket) {
    throw new Error('Missing AWS_S3_BUCKET in environment variables');
  }

  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    '';

  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    '';

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS access credentials in environment variables');
  }

  return {
    endpoint:
      process.env.AWS_S3_ENDPOINT_URL?.trim() ||
      process.env.S3_ENDPOINT_URL?.trim() ||
      process.env.R2_ENDPOINT_URL?.trim() ||
      undefined,
    bucket,
    accessKeyId,
    secretAccessKey,
    region: normalizeRegion(
      process.env.AWS_REGION || process.env.R2_REGION || undefined
    ),
  };
};

const downloadImageBytes = async (sourceUrl: string) => {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image (${response.status} ${response.statusText})`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  if (bytes.length === 0) {
    throw new Error('Downloaded image is empty');
  }

  return {
    bytes,
    contentType: response.headers.get('content-type') || 'image/png',
  };
};

const inferExtension = (sourceUrl: string, contentType: string) => {
  const pathname = new URL(sourceUrl).pathname;
  const existingExtension = pathname.split('.').pop()?.toLowerCase();

  if (existingExtension && existingExtension.length <= 5) {
    return existingExtension;
  }

  if (contentType.includes('jpeg')) {
    return 'jpg';
  }

  if (contentType.includes('png')) {
    return 'png';
  }

  if (contentType.includes('webp')) {
    return 'webp';
  }

  return 'png';
};

const buildImageObjectKey = (sourceUrl: string, extension: string) => {
  const hash = createHash('sha256').update(sourceUrl).digest('hex');
  const prefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

  return `${IMAGE_STORAGE_PREFIX}/${prefix}/${hash}.${extension}`;
};

const buildUploadThingFileName = (objectKey: string) => {
  const fileName = objectKey.split('/').pop() || 'generated-image.png';

  return sanitizePathSegment(fileName);
};

const uploadToUploadThing = async (
  bytes: Buffer,
  fileName: string,
  contentType: string
): Promise<GeneratedImageStorageResult> => {
  const utapi = new UTApi({ token: getUploadThingToken() });
  const file = new UTFile([new Uint8Array(bytes)], fileName, {
    type: contentType,
  });

  const result = await utapi.uploadFiles(file);

  if (result.error || !result.data?.ufsUrl || !result.data?.key) {
    const reason = result.error?.message || 'UploadThing upload failed';
    throw new Error(reason);
  }

  return {
    provider: 'uploadthing',
    key: result.data.key,
    url: result.data.ufsUrl,
  };
};

const uploadToS3 = async (
  bytes: Buffer,
  objectKey: string,
  contentType: string
): Promise<GeneratedImageStorageResult> => {
  const config = getS3Config();

  const s3 = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: bytes,
      ContentType: contentType,
    })
  );

  const publicBase =
    process.env.AWS_S3_PUBLIC_BASE_URL?.trim() ||
    process.env.R2_PUBLIC_BASE_URL?.trim() ||
    (config.endpoint
      ? `${trimTrailingSlash(config.endpoint)}/${config.bucket}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com`);

  return {
    provider: 's3',
    key: objectKey,
    url: `${trimTrailingSlash(publicBase)}/${objectKey}`,
  };
};

export const mirrorGeneratedImageToOwnedStorage = async (
  input: GeneratedImageStorageInput
): Promise<GeneratedImageStorageResult> => {
  const { bytes, contentType } = await downloadImageBytes(input.sourceUrl);
  const extension = inferExtension(input.sourceUrl, contentType);
  const objectKey = buildImageObjectKey(input.sourceUrl, extension);
  const fileName = buildUploadThingFileName(objectKey);

  try {
    const uploadThingResult = await uploadToUploadThing(
      bytes,
      fileName,
      contentType
    );

    logger.info(
      `[Image Storage] Mirrored generated image to UploadThing (${uploadThingResult.key})`
    );

    return uploadThingResult;
  } catch (uploadThingError) {
    logger.warn(
      `[Image Storage] UploadThing upload failed; falling back to S3: ${String(uploadThingError)}`
    );
  }

  const s3Result = await uploadToS3(bytes, objectKey, contentType);

  logger.info(
    `[Image Storage] Mirrored generated image to S3 (${s3Result.key})`
  );

  return s3Result;
};
