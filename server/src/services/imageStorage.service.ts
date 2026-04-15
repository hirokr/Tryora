import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import logger from '#src/config/logger.ts';
import {
  GeneratedImageStorageInput,
  GeneratedImageStorageResult,
} from '#src/types/image.js';
import {
  buildImageObjectKey,
  buildUploadThingFileName,
  downloadImageBytes,
  getS3Config,
  inferExtension,
  trimTrailingSlash,
  uploadToUploadThing,
} from '#src/utils/image/image.ts';

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
