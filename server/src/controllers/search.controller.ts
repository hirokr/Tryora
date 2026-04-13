import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';

import { extractSearchData } from '#src/utils/groq.ts';
import {
  checkIntent,
  createSearch,
  setProducts,
  updateSearchStatus,
} from '#src/services/search.service.ts';

import { searchSerper } from '#src/utils/serper.ts';
import { Product } from '#src/types/product.js';

export const searchProducts = async (req: AuthRequest, res: Response) => {
  let searchRecordId: string | null = null;

  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userInput, geo } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const aiResult = await extractSearchData(userInput);

    if (!aiResult.status) {
      return res.status(500).json({
        message: aiResult.message || 'AI extraction failed',
      });
    }

    const { intentKey, product, style, occasion, gender, queries } =
      aiResult.data as {
        intentKey: string;
        product: string;
        style: string;
        occasion: string;
        gender: string;
        queries: string[];
      };

    const cached = await checkIntent(intentKey);

    if (cached.status === 'cached') {
      return res.status(200).json({
        status: 'cached',
        intentKey,
        results: cached.results,
      });
    }
    const searchRecord = await createSearch({
      prompt: userInput,
      intentKey,
      parsedParams: {
        product,
        style,
        occasion,
        gender,
      },
      geo,
      userId: req.userId,
    });

    searchRecordId = searchRecord.id;

    const serperResults = await Promise.allSettled(
      queries.map((q: string) => searchSerper(q))
    );

    const successfulResults = serperResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value || []);

    if (!successfulResults.length) {
      await updateSearchStatus(searchRecord.id, 'FAILED', 'No results found');

      return res.status(200).json({
        status: 'empty',
        intentKey,
        results: [],
      });
    }

    const flatProducts: Product[] = successfulResults;

    const uniqueProducts = Array.from(
      new Map(flatProducts.map(p => [p.link, p])).values()
    );

    await setProducts(searchRecord.id, uniqueProducts);

    await updateSearchStatus(searchRecord.id, 'COMPLETED');

    return res.status(200).json({
      status: 'fresh',
      intentKey,
      searchId: searchRecord.id,
      results: uniqueProducts,
    });
  } catch (error: any) {
    console.error('Search Error:', error);

    if (searchRecordId) {
      await updateSearchStatus(searchRecordId, 'FAILED', error.message);
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
