export type Product = {
  title: string;
  source: string | null;
  googlelink: string | null;
  price: string | null;
  defaultImageUrl: string;
  rating: number | null;
  ratingCount: number | null;
  searchProductId: string | null;
};

export type ProductMetricAction = 'VIEW' | 'CLICK' | 'LIKE';
