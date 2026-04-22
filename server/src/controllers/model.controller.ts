import { JobStatus, JobType } from '#src/generated/enums.ts';
import { enqueue3DModelJob } from '#src/queues/queue.ts';
import { createJob } from '#src/services/job.service.ts';
import { getTryOnImage } from '#src/services/tryon.service.ts';
import { HunyuanStatusResponse } from '#src/types/3d.js';
import { AuthRequest, Response } from '#src/types/authRequest.js';
import { JobResponseType } from '#src/types/jobs.js';
import { removeBackground } from '#src/utils/image/removeBg.ts';
import {
  buildHunyuanStartPayload,
  generate3DModelTryon,
} from '#src/utils/generateModel.ts';
import { handleFileUpload } from '#src/utils/uploadthings.ts';
import { unlink } from 'node:fs/promises';

const uploadProcessedImage = async (
  imagePath: string,
  fileName: string
): Promise<string> => {
  const uploadedImage = await handleFileUpload(fileName, imagePath);
  const uploadedUrl = uploadedImage?.[0]?.data?.ufsUrl;

  if (!uploadedUrl) {
    throw new Error('Failed to upload processed 3D input image');
  }

  return uploadedUrl;
};

// todo: generate 3d model
export const generateModelTryon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tryonId, prompt = '' } = req.body;

    if (!tryonId || typeof tryonId !== 'string') {
      return res.status(400).json({ message: 'Invalid tryonId' });
    }

    const resultUrl = await getTryOnImage(tryonId);
    if (!resultUrl) {
      return res.status(404).json({ message: 'Try-on result not found' });
    }

    const { outputPath } = await removeBackground(resultUrl, req.userId);

    try {
      const processedImageUrl = await uploadProcessedImage(
        outputPath,
        `model-input-${tryonId}.png`
      );

      const modelGeneration: HunyuanStatusResponse = await generate3DModelTryon(
        buildHunyuanStartPayload(
          processedImageUrl,
          typeof prompt === 'string' ? prompt : ''
        )
      );

      if (!modelGeneration) {
        return res.status(500).json({
          message: 'Failed to start image fusion',
        });
      }

      const jobStart: JobResponseType = await createJob({
        userId: req.userId,
        variantId: undefined,
        jobType: JobType.MODEL,
        thirdPartyTaskId: String(modelGeneration.request_id),
        outputresultUrl: modelGeneration.polling_url,
      });

      await enqueue3DModelJob({
        jobType: JobType.MODEL,
        generationJobId: jobStart.jobId,
        userId: req.userId,
        imageUri: resultUrl,
        outputResultUrl: modelGeneration.polling_url,
      });

      return res.status(200).json({
        success: true,
        JobType: JobType.MODEL,
        status: JobStatus.QUEUED,
        jobId: jobStart.jobId,
      });
    } finally {
      await unlink(outputPath).catch(() => undefined);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fuse product images',
    });
  }
};
