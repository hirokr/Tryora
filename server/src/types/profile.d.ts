export type userbodyimage = {
  poser: string;
  imageUrl: string;
};

export type userProfile = {
  age: number;
  ethnicity: string;
  gender: string;
  location: string;

  preferredColors: string[];
  styleTags: string[];

  notificationPrefs: boolean;
};
