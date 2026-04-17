import { JobType, PROVIDER } from '#src/generated/enums.ts';

export type TryOnUpdateDataType = {
  productIds?: string[];
  jobId?: string;
  resultUrl?: string;
  tryonType?: JobType;
  provider?: PROVIDER;
  isFavorite?: boolean;
  isPublic?: boolean;
};
