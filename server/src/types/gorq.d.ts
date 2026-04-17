export type SearchData = {
  intentKey: string;
  product: string;
  style: string;
  occasion: string;
  gender: string;
  category: string;
  culturalTags: string[];
  queries: string[];
};

export type ExtractSearchDataResult =
  | {
      status: true;
      data: SearchData;
    }
  | {
      status: false;
      message: string;
    };
