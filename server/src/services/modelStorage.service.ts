import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { UTApi, UTFile } from 'uploadthing/server';
import logger from '#src/config/logger.ts';

const MODEL_CONTENT_TYPE = 'model/gltf-binary';
const MODEL_STORAGE_PREFIX = 'models/3d';

type MirrorModelInput = {
  sourceUrl: string;
  userId: string;
  tryonResultId: string;
  generationJobId: string;
};

type MirrorModelResult = {
  provider: 'uploadthing' | 'r2';
  key: string;
  url: string;
};

type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const sanitizePathSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

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

const parseEndpoint = (rawEndpoint: string) => {
  const parsed = new URL(rawEndpoint);
  return {
    endpointOrigin: `${parsed.protocol}//${parsed.host}`,
    endpointPath: parsed.pathname.replace(/^\/+/, ''),
  };
};

const getR2Config = (): R2Config => {
  const endpointValue =
    process.env.R2_ENDPOINT_URL?.trim() || process.env.S3_ENDPOINT_URL?.trim();

  if (!endpointValue) {
    throw new Error('Missing R2 endpoint configuration');
  }

  const { endpointOrigin, endpointPath } = parseEndpoint(endpointValue);

  const bucket =
    process.env.R2_BUCKET?.trim() ||
    process.env.AWS_S3_BUCKET?.trim() ||
    endpointPath;

  if (!bucket) {
    throw new Error('Missing R2 bucket configuration');
  }

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 access credentials');
  }

  return {
    endpoint: endpointOrigin,
    bucket,
    accessKeyId,
    secretAccessKey,
    region: normalizeRegion(
      process.env.R2_REGION || process.env.AWS_REGION || undefined
    ),
  };
};

const getUploadThingToken = () => {
  const token = process.env.UPLOADTHING_TOKEN?.trim();

  if (!token) {
    throw new Error('Missing UPLOADTHING_TOKEN in environment variables');
  }

  return token;
};

const buildModelObjectKey = ({
  userId,
  tryonResultId,
  generationJobId,
}: Omit<MirrorModelInput, 'sourceUrl'>) => {
  const safeUserId = sanitizePathSegment(userId);
  const safeTryonResultId = sanitizePathSegment(tryonResultId);
  const safeGenerationJobId = sanitizePathSegment(generationJobId);

  return `${MODEL_STORAGE_PREFIX}/${safeUserId}/${safeTryonResultId}/${safeGenerationJobId}.glb`;
};

const buildUploadThingFileName = ({
  userId,
  tryonResultId,
  generationJobId,
}: Omit<MirrorModelInput, 'sourceUrl'>) => {
  const safeUserId = sanitizePathSegment(userId);
  const safeTryonResultId = sanitizePathSegment(tryonResultId);
  const safeGenerationJobId = sanitizePathSegment(generationJobId);

  return `${safeUserId}-${safeTryonResultId}-${safeGenerationJobId}.glb`;
};

const downloadModelBytes = async (sourceUrl: string) => {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download generated model (${response.status} ${response.statusText})`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  if (bytes.length === 0) {
    throw new Error('Downloaded model is empty');
  }

  return bytes;
};

const uploadToUploadThing = async (
  bytes: Buffer,
  fileName: string
): Promise<MirrorModelResult> => {
  const utapi = new UTApi({ token: getUploadThingToken() });

  const filePayload = new Uint8Array(bytes);

  const file = new UTFile([filePayload], fileName, {
    type: MODEL_CONTENT_TYPE,
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

const uploadToR2 = async (
  bytes: Buffer,
  objectKey: string
): Promise<MirrorModelResult> => {
  const config = getR2Config();

  const s3 = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
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
      ContentType: MODEL_CONTENT_TYPE,
    })
  );

  const publicBase =
    process.env.R2_PUBLIC_BASE_URL?.trim() ||
    `${trimTrailingSlash(config.endpoint)}/${config.bucket}`;

  return {
    provider: 'r2',
    key: objectKey,
    url: `${trimTrailingSlash(publicBase)}/${objectKey}`,
  };
};

export const mirror3DModelToOwnedStorage = async (
  input: MirrorModelInput
): Promise<MirrorModelResult> => {
  const bytes = await downloadModelBytes(input.sourceUrl);

  const uploadThingFileName = buildUploadThingFileName(input);
  const r2ObjectKey = buildModelObjectKey(input);

  try {
    const uploadThingResult = await uploadToUploadThing(
      bytes,
      uploadThingFileName
    );

    logger.info(
      `[3D Storage] Mirrored model to UploadThing (${uploadThingResult.key})`
    );

    return uploadThingResult;
  } catch (uploadThingError) {
    logger.warn(
      `[3D Storage] UploadThing upload failed; falling back to R2: ${String(uploadThingError)}`
    );
  }

  const r2Result = await uploadToR2(bytes, r2ObjectKey);

  logger.info(`[3D Storage] Mirrored model to R2 (${r2Result.key})`);

  return r2Result;
};
