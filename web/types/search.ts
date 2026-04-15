export interface SearchProduct {
  id?: string;
  searchId?: string;
  title: string;
  productUrl?: string | null;
  link?: string | null;
  price?: number | null;
  currency?: string | null;
  image?: string | null;
  category?: string | null;
  brand?: string | null;
  source?: string | null;
  rating?: number | null;
  trendingScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResponse {
  status?: string;
  searchId?: string;
  intentKey?: string;
  results?: SearchProduct[];
  message?: string;
}
