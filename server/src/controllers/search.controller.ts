import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';

import { extractSearchData } from '#src/utils/groq.ts';
import {
  checkIntent,
  createSearch,
  getSearchesByUserId,
  setProducts,
} from '#src/services/search.service.ts';
import {
  getProductById,
  getProductsByIds,
  getProductsByfilters,
  getProductsBySearchID,
  updateTrendingScore,
} from '#src/services/product.service.ts';
import {
  getProductIdsByIntent,
  setProductIdsByIntent,
} from '#src/utils/redis.ts';

import { searchSerper } from '#src/utils/serper.ts';
import { Product, type ProductMetricAction } from '#src/types/product.js';
import { SearchData } from '#src/types/gorq.js';

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

    const {
      intentKey,
      product,
      style,
      occasion,
      gender,
      category,
      culturalTags,
      queries,
    } = aiResult.data as SearchData;
    const cached = await checkIntent(intentKey);

    const redisProductIds = await getProductIdsByIntent(intentKey);
    if (redisProductIds?.length) {
      const cachedProducts = await getProductsByIds(redisProductIds);
      if (cachedProducts.length) {
        const productById = new Map(
          cachedProducts.map(item => [item.id, item])
        );
        const orderedProducts = redisProductIds
          .map(productId => productById.get(productId))
          .filter(Boolean);

        return res.status(200).json({
          status: 'cached',
          intentKey,
          results: orderedProducts,
        });
      }
    }

    if (cached.status === 'cached') {
      const cachedResults = cached.results ?? [];
      const cachedProductIds = cachedResults.map(item => item.id);
      await setProductIdsByIntent(intentKey, cachedProductIds);

      return res.status(200).json({
        status: 'cached',
        intentKey,
        results: cachedResults,
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
        category,
        culturalTags,
      },
      location: typeof geo === 'string' ? geo : undefined,
      userId: req.userId,
    });

    searchRecordId = searchRecord.id;

    const serperResults = await Promise.allSettled(
      queries.map((q: string) => searchSerper(q))
    );

    const successfulResults = serperResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value || []);

    const flatProducts: Product[] = successfulResults;

    const uniqueProducts = Array.from(
      new Map(flatProducts.map(p => [p.searchProductId, p])).values()
    );

    await setProducts(searchRecord.id, uniqueProducts);

    const savedProducts = await getProductsBySearchID(searchRecord.id);
    if (savedProducts.length) {
      await setProductIdsByIntent(
        intentKey,
        savedProducts.map(item => item.id)
      );
    }

    return res.status(200).json({
      status: 'fresh',
      intentKey,
      searchId: searchRecord.id,
      results: savedProducts.length ? savedProducts : uniqueProducts,
    });
  } catch (error: any) {
    console.error('Search Error:', error);

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

    const products = await getProductsBySearchID(searchId);

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
