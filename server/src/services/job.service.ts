import prisma from '#src/config/database.ts';
import { JobType } from '#src/generated/enums.ts';
import { JobRequestType, JobResponseType } from '#src/types/Job.js';

export const createJob = async (
  data: JobRequestType
): Promise<JobResponseType> => {
  const job = await prisma.job.create({
    data: {
      userId: data.userId,
      productId: data.productId,
      jobType: data.jobType || JobType.IMAGE_TRYON,
      thirdPartyTaskId: String(data.thirdPartyTaskId),
      outputresultUrl: data.outputresultUrl,
    },
  });

  return {
    jobId: job.id,
    status: job.status,
    outputresultUrl: job.outputresultUrl,
  };
};
