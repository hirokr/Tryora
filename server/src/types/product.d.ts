export type Product = {
  title: string;
  searchId: string;
  price?: number | null;
  currency?: string | null;
  image: string;
  category?: string | null;
  colorTags?: any;
  brand?: string | null;
  source?: string | null;
  rating?: number | null;
};
