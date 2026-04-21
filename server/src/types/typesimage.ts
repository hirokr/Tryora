import { JobType } from '#src/generated/enums.ts';

export type GeneratedImageStorageInput = {
  sourceUrl: string;
};

export type GeneratedImageStorageResult = {
  provider: 'uploadthing' | 's3';
  key: string;
  url: string;
};

export interface ClaidImageEditRequest {
  productImageUrl: string;
  userPrompt: string;
}

export enum claidStatus {
  accepted = 'ACCEPTED',
  waiting = 'WAITING',
  processing = 'PROCESSING',
  done = 'DONE',
  error = 'ERROR',
  cancelled = 'CANCELLED',
  paused = 'PAUSED',
}

export interface ClaidApiResponse {
  data?: {
    id: number;
    status: claidStatus;
    created_at: string;
    request: Record<string, unknown>;
    result_url: string;
  };
}

export type ClaidImageObject = {
  ext: string;
  mps: number;
  mime: string;
  format: string;
  width: number;
  height: number;
};

export type ClaidTaskError = {
  error: string;
  created_at: string;
};

export type ClaidOutputObject = ClaidImageObject & {
  tmp_url: string;
  object_key: string;
  object_bucket: string;
  object_uri: string;
  claid_storage_uri: string;
};

export interface ClaidTaskStatusResponse {
  data: {
    id: number;
    status: claidStatus;
    created_at: string;
    request: Record<string, unknown>;
    errors?: ClaidTaskError[];
    result?: {
      input_objects: ClaidImageObject[];
      output_objects: ClaidOutputObject[];
    };
  };
}

export interface ClaidDoneTaskResponse {
  data: ClaidTaskStatusResponse['data'] & {
    status: claidStatus.done;
    result: {
      input_objects: ClaidImageObject[];
      output_objects: ClaidOutputObject[];
    };
  };
}

export interface ClaidAcceptedTaskResponse {
  data: ClaidTaskStatusResponse['data'] & {
    status: claidStatus.accepted;
  };
}

export interface ImageGenerationQueueParams {
  sourceImageUrl: string;
  userPrompt: string;
  variantId?: string;
}

export interface ImageFusionQueueParams {
  baseImageUrl: string;
  productImageUrls: string[];
  bodyImageId?: string;
}

export type ImageQueueParams =
  | ImageGenerationQueueParams
  | ImageFusionQueueParams;

export interface ProductImageEditJobData {
  jobType: JobType;
  generationJobId: string;
  productId: string;
  params: ImageQueueParams;
}

// {
//   data: {
//     key: 'BVSc6zHLyH5XpV8fmutX3JxGmq6WHyKTrenVRM4sobgNdZlu',
//     url: 'https://utfs.io/f/BVSc6zHLyH5XpV8fmutX3JxGmq6WHyKTrenVRM4sobgNdZlu',
//     appUrl: 'https://utfs.io/a/fhy3ttdc07/BVSc6zHLyH5XpV8fmutX3JxGmq6WHyKTrenVRM4sobgNdZlu',
//     ufsUrl: 'https://fhy3ttdc07.ufs.sh/f/BVSc6zHLyH5XpV8fmutX3JxGmq6WHyKTrenVRM4sobgNdZlu',
//     lastModified: 1776445791139,
//     name: 'profile-image.png',
//     size: 40870,
//     type: 'image/png',
//     customId: null,
//     fileHash: '1b7c1582fdb7e8ccfeeeb27b8c1cfc6e'
//   },
//   error: null
// }
// hirokr@hirokr:server$
