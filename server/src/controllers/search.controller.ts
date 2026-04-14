import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';

import { extractSearchData } from '#src/utils/groq.ts';
import {
  checkIntent,
  createSearch,
  getProductById,
  getProductsByfilters,
  getProductsBySearchID,
  getSearchesByUserId,
  getTopTrending,
  setProducts,
  updateSearchStatus,
  updateTrendingScore,
} from '#src/services/search.service.ts';

import { searchSerper } from '#src/utils/serper.ts';
import { Product, type ProductMetricAction } from '#src/types/product.js';

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

export const getUserSearchHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const products = await getSearchesByUserId(req.userId);

    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'cached',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch search history ',
    });
  }
};

export const getProductsBySearchId = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rawSearchId = req.params.searchId;
    const searchId = Array.isArray(rawSearchId) ? rawSearchId[0] : rawSearchId;

    if (!searchId || typeof searchId !== 'string') {
      return res.status(400).json({ message: 'Invalid search id' });
    }

    const products = await getProductsBySearchID(searchId, req.userId);

    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'cached',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch products for this search ',
    });
  }
};

export const getProductsById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { productId } = req.params;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      status: 'cached',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch product ',
    });
  }
};

// object: {filterQuery: {
//   minPrice: 20;
// maxPrice: 1000;
// source: arong;
// catogory: saree;
// subCatogory: bangladeshi;
// brand: arong;
// title: saree;
// color: red;
// }}
export const searchProductsByQuery = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { filterQuery } = req.body;
    if (!filterQuery || typeof filterQuery !== 'object') {
      return res.status(400).json({ message: 'Invalid filter query' });
    }

    const products = await getProductsByfilters(filterQuery);
    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch products for this search ',
    });
  }
};

export const updateProductMetrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { productId } = req.params;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const { action } = req.body as { action?: string };
    const normalizedAction = action?.toUpperCase();

    if (
      !normalizedAction ||
      !['VIEW', 'CLICK', 'LIKE'].includes(normalizedAction)
    ) {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    const updatedProduct = await updateTrendingScore(
      productId,
      normalizedAction as ProductMetricAction
    );

    return res.status(200).json({
      status: 'success',
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to update product metrics',
    });
  }
};

export const getTopTrendingProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const numericLimit =
      typeof limit === 'string' && !isNaN(parseInt(limit))
        ? parseInt(limit)
        : 20;
    const numericSkip =
      typeof skip === 'string' && !isNaN(parseInt(skip)) ? parseInt(skip) : 0;

    const products = await getTopTrending(numericLimit, numericSkip);

    if (!products.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'success',
      results: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch trending products',
    });
  }
};
