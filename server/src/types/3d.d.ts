import type { JobType } from '#src/generated/enums.ts';

// Types to add to your #src/types/3d.ts
export interface TripoStartRequestPayload {
  texture: 'standard' | string;
  texture_alignment: 'original_image' | string;
  orientation: 'default' | string;
  image_url: string;
}

export interface TripoStatusResponse {
  request_id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  polling_url: string;
}

export interface TripoResultResponse {
  request_id: string;
  status:
    | 'QUEUED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | string;
  model_id?: string;
  error?: string | null;
  output: {
    media_url: string[];
    media_type: string;
  } | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Generate3DModelJobData {
  generationJobId: string;
  userId: string;
  jobType: JobType;
  imageUri: string;
  outputResultUrl: string;
}

// {
//   "request_id": "Tripo-image_019dxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
//   "status": "COMPLETED",
//   "model_id": "Tripo-image",
//   "error": null,
//   "output": {
//     "media_url": [
//       "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/v1/hunyuan-image_019dxxxx-xxxx/output.ext"
//     ],
//     "media_type": "application/octet-stream"
//   },
//   "created_at": "2026-03-31T10:00:00.000Z",
//   "updated_at": "2026-03-31T10:00:15.000Z",
//   "completed_at": "2026-03-31T10:00:15.000Z"
// }

export interface Hunyuan3DRequestPayload {
  input_image_url: string;
  prompt?: string;
  face_count?: number;
}

export interface Hunyuan3DStartResponse {
  request_id: string;
  status: string;
  polling_url: string;
}