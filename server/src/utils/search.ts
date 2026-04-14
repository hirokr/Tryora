


export const calculateTrendingScore = (
  likeCount: number,
  viewCount: number,
  orderCount: number = 0
) => {
  const likeWeight = 3;
  const viewWeight = 1;
  const orderWeight = 5;

  const baseScore =
    likeCount * likeWeight + viewCount * viewWeight + orderCount * orderWeight;

  return Number(Math.log1p(baseScore).toFixed(6));
};
