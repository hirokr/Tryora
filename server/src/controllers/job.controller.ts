//-
import { getTryonJobStatusState } from '#src/services/tryonJobStatus.service.ts';
import { AuthRequest, Response } from '#src/types/authRequest.js';

export const getTryonJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { jobId } = req.params;
    console.log(jobId);
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const jobState = await getTryonJobStatusState(jobId);
    if (jobState.ownerUserId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({
      success: true,
      data: jobState.payload,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('was not found')) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
    });
  }
};
