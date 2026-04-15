export type Product = {
  title: string;
  searchId: string;
  price?: number | null;
  link?: string | null;
  currency?: string | null;
  image: string;
  category?: string | null;
  colorTags?: any;
  patternTags?: any;
  brand?: string | null;
  source?: string | null;
  rating?: number | null;
};

export type ProductMetricAction = 'VIEW' | 'CLICK' | 'LIKE';
