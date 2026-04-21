export type MeAndMyselfImage = {
  id: string;
  imageUrl: string;
  createdAt?: string;
  label: string;
};

export type OutfitSelectionPayload = {
  selectedAt: string;
  source: "dashboard";
  outfitA: MeAndMyselfImage;
  outfitB: MeAndMyselfImage;
};
