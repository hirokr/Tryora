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

enum claidStatus {
  accepted = 'ACCEPTED',
  processing = 'PROCESSING',
  error = 'ERROR',
  done = 'DONE',
}

export interface ClaidApiResponse {
  data: {
    id: string;
    status: claidStatus;
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

export interface ClaidDoneTaskResponse {
  data: {
    id: number;
    status: 'DONE';
    created_at: string;
    request: {
      input: string;
      options: {
        prompt: string;
      };
    };
    errors: Array<{
      error?: string;
      created_at?: string;
    }>;
    result: {
      input_object: ClaidImageObject;
      output_objects: Array<
        ClaidImageObject & {
          tmp_url: string;
        }
      >;
    };
  };
}

// {
//   "input": "storage://storage-name/input-path/input.png",
//   "output": {
//     "destination": "storage://storage-name/result-path/image-name.jpg",
//     "format": "png",
//     "number_of_images": 1
//   },
//   "options": {
//     "model": "v1" | "v2",
//     "prompt": "add a duck",
//     "inference_steps": 50,
//     "guidance_scale": 4.0,
//     "aspect_ratio": "1:1"
//   }
// }
