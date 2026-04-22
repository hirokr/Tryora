export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  age?: number | null;
  gender?: string;
  location?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  interests?: string[];
  userBodyImageUrl?: string | null;
  demographics?: {
    ageRange?: string;
    gender?: string;
    location?: string;
  };
};

export type TryonRecord = {
  id: string;
  jobId?: string;
  resultUrl?: string;
  productIds?: string[];
  tryonType?: string;
  isFavorite?: boolean;
  isPublic?: boolean;
  createdAt?: string;
};

export type MeAndMyselfImage = {
  id: string;
  imageUrl: string;
  label: string;
  createdAt?: string;
};

export type DashboardMetrics = {
  favouriteCount: number;
  tryonImagesCount: number;
  wardrobeItemsCount: number;
};

export type DashboardData = {
  profile: UserProfile | null;
  metrics: DashboardMetrics;
  gallery: MeAndMyselfImage[];
  publicTryonsCount: number;
};
