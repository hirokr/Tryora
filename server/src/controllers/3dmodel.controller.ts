import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import {
  clear3DModelByTryonResultId,
  create3DModelGenerationJob,
  findTryonResult3DRecord,
  getGenerationJobProgress,
  getGenerationJobStatusForUser,
} from '#src/services/3dmodel.service.ts';

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const request3DModelGeneration = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tryonResultId, prompt } = req.body;

    if (!tryonResultId || typeof tryonResultId !== 'string') {
      return res.status(400).json({ message: 'tryonResultId is required' });
    }

    const tryonResult = await findTryonResult3DRecord(
      req.userId,
      tryonResultId
    );

    if (!tryonResult) {
      return res.status(404).json({ message: 'TryonResult not found' });
    }

    if (tryonResult.glbUrl) {
      return res.status(409).json({
        message: '3D model already generated',
        glbUrl: tryonResult.glbUrl,
      });
    }

    const generationJob = await create3DModelGenerationJob(req.userId, {
      tryonResultId,
      imageUri: tryonResult.resultImageUrl,
      prompt: typeof prompt === 'string' ? prompt : '',
    });

    return res.status(202).json({
      jobId: generationJob.id,
      status: generationJob.status,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to enqueue 3D model job' });
  }
};

export const get3DGenerationJobStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const jobId = getSingleParam(req.params.jobId);

    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    const generationJob = await getGenerationJobStatusForUser(
      req.userId,
      jobId
    );

    if (!generationJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json(generationJob);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch job status' });
  }
};

export const get3DModelByTryonResultId = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tryonResultId = getSingleParam(req.params.tryonResultId);

    if (!tryonResultId) {
      return res.status(400).json({ message: 'tryonResultId is required' });
    }

    const tryonResult = await findTryonResult3DRecord(
      req.userId,
      tryonResultId
    );

    if (!tryonResult) {
      return res.status(404).json({ message: 'TryonResult not found' });
    }

    if (!tryonResult.glbUrl) {
      const generationJob = tryonResult.glbJobId
        ? await getGenerationJobProgress(tryonResult.glbJobId)
        : null;

      return res.status(202).json({
        message: '3D model is not ready yet',
        job: generationJob,
      });
    }

    return res.status(200).json({
      glbUrl: tryonResult.glbUrl,
      jobId: tryonResult.glbJobId,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch 3D model' });
  }
};

export const delete3DModelByTryonResultId = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tryonResultId = getSingleParam(req.params.tryonResultId);

    if (!tryonResultId) {
      return res.status(400).json({ message: 'tryonResultId is required' });
    }

    const tryonResult = await findTryonResult3DRecord(
      req.userId,
      tryonResultId
    );

    if (!tryonResult) {
      return res.status(404).json({ message: 'TryonResult not found' });
    }

    if (!tryonResult.glbUrl) {
      return res.status(404).json({ message: 'No generated 3D model found' });
    }

    await clear3DModelByTryonResultId(tryonResult.id, tryonResult.glbUrl);

    return res.status(200).json({ message: '3D model removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete 3D model' });
  }
};
