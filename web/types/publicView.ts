export type JobStatusResponse = {
  success?: boolean;
  data?: {
    outputresultUrl?: string | null;
    outputResultUrl?: string | null;
    tryonData?: {
      id?: string;
      resultUrl?: string | null;
    } | null;
  };
};

export type TryonItemResponse = {
  id?: string;
  productIds?: string[];
  data?: {
    id?: string;
    productIds?: string[];
  };
};

export type ProductResponse = {
  id?: string;
  title?: string;
  defaultImageUrl?: string | null;
  price?: string | number | null;
  data?: {
    id?: string;
    title?: string;
    defaultImageUrl?: string | null;
    price?: string | number | null;
  };
  result?: {
    id?: string;
    title?: string;
    defaultImageUrl?: string | null;
    price?: string | number | null;
  };
};

export type SidebarProduct = {
  id: string;
  name: string;
  price: string;
  img: string;
};