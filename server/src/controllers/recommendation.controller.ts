//2
import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import { getRuntimeRecommendations } from '#src/services/product.service.ts';
import {
  getRecentIntentKeysByUser,
  getRecentIntentKeysGlobal,
  getSearchByIntent,
} from '#src/services/search.service.ts';
import { recommendIntentKey } from '#src/utils/openrouter.ts';

const parseNumberQuery = (value: unknown, fallbackValue: number) => {
  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallbackValue : parsed;
};

export const getRuntimeProductRecommendations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const limit = parseNumberQuery(req.query.limit, 20);
    const skip = parseNumberQuery(req.query.skip, 0);
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;

    const userRecentIntents = await getRecentIntentKeysByUser(req.userId, 30);
    const globalRecentIntents = await getRecentIntentKeysGlobal(10);
    const intentCandidates = Array.from(
      new Set([...userRecentIntents, ...globalRecentIntents])
    );

    if (intentCandidates.length > 0) {
      const intentResult = await recommendIntentKey({
        userRecentIntents,
        globalRecentIntents,
        candidates: intentCandidates,
      });

      if (intentResult.status) {
        const search = await getSearchByIntent(intentResult.intentKey);

        if (search?.products?.length) {
          const results = search.products.map(product => ({
            id: product.id,
            title: product.title,
            source: product.source,
            defaultImageUrl: product.defaultImageUrl,
            price: product.price,
            viewCount: product.viewCount,
            likeCount: product.likeCount,
          }));

          return res.status(200).json({
            status: 'success',
            results,
          });
        }
      }
    }

    const recommendations = await getRuntimeRecommendations({
      userId: req.userId,
      limit,
      skip,
      category,
    });

    if (!recommendations.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    return res.status(200).json({
      status: 'success',
      results: recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch runtime recommendations',
    });
  }
};
