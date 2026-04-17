import { JobStatus, JobType } from '#src/generated/enums.ts';
import { enqueue3DModelJob } from '#src/queues/queue.ts';
import { createJob } from '#src/services/job.service.ts';
import { getTryOnById } from '#src/services/tryon.service.ts';
import { HunyuanStatusResponse } from '#src/types/3d.js';
import { AuthRequest, Response } from '#src/types/authRequest.js';
import { JobResponseType } from '#src/types/Job.js';
import {
  buildHunyuanStartPayload,
  generate3DModelTryon,
} from '#src/utils/generateModel.ts';

// todo: generate 3d model
export const generateModelTryon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tryonId, prompt } = req.body;

    if (!tryonId || typeof tryonId !== 'string') {
      return res.status(400).json({ message: 'Invalid tryonId' });
    }

    const tryon = await getTryOnById(tryonId);
    if (!tryon?.resultUrl) {
      return res.status(404).json({ message: 'Try-on result not found' });
    }

    const { resultUrl } = tryon;

    // todo: remove background from user image before fusion to improve results

    const modelGeneration: HunyuanStatusResponse = await generate3DModelTryon(
      buildHunyuanStartPayload(
        resultUrl,
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fuse product images',
    });
  }
};
