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
  getProductsBySearchID,
  updateTrendingScore,
} from '#src/services/product.service.ts';
import {
  getProductIdsByIntent,
  setProductIdsByIntent,
} from '#src/utils/redis.ts';
import { handleUrlUpload } from '#src/utils/uploadthings.ts';

import { searchSerper } from '#src/utils/serper.ts';
import { Product } from '#src/types/product.js';
import { SearchData } from '#src/types/gorq.js';

const uploadSingleImage = async (
  url: string,
  filename: string,
  retries = 2
): Promise<string | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await handleUrlUpload(url, filename);
      const uploaded = res?.[0]?.data?.ufsUrl;

      if (uploaded) return uploaded;
    } catch (err) {
      if (attempt === retries) {
        console.error(`❌ Upload failed: ${url}`);
      }
    }
  }

  return null;
};

const uploadSerperProductImages = async (
  products: Product[]
): Promise<Product[]> => {
  const CONCURRENCY = 5;
  const results: Product[] = [];

  // 🔥 Deduplicate by image BEFORE upload
  const uniqueProducts = Array.from(
    new Map(products.map(p => [p.defaultImageUrl, p])).values()
  );

  for (let i = 0; i < uniqueProducts.length; i += CONCURRENCY) {
    const chunk = uniqueProducts.slice(i, i + CONCURRENCY);

    const processed = await Promise.all(
      chunk.map(async (product, index) => {
        if (!product.defaultImageUrl) return null;

        const uploadedUrl = await uploadSingleImage(
          product.defaultImageUrl,
          `serper-product-${product.searchProductId || i + index}.jpg`
        );

        // 🚨 STRICT MODE: DROP if upload fails
        if (!uploadedUrl) return null;

        return {
          ...product,
          defaultImageUrl: uploadedUrl,
        };
      })
    );

    results.push(...(processed.filter(Boolean) as Product[]));
  }

  return results;
};

export const searchProducts = async (req: AuthRequest, res: Response) => {
  let searchRecordId: string | null = null;

  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userInput, location } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const aiResult = await extractSearchData(userInput, location);

    if (!aiResult.status) {
      return res.status(500).json({
        message: 'AI extraction failed',
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

    // 🔁 Redis Cache Check
    const redisProductIds = await getProductIdsByIntent(intentKey);
    if (redisProductIds?.length) {
      const cachedProducts = await getProductsByIds(redisProductIds);

      if (cachedProducts.length) {
        const productMap = new Map(cachedProducts.map(p => [p.id, p]));

        const ordered = redisProductIds
          .map(id => productMap.get(id))
          .filter(Boolean);

        return res.status(200).json({
          status: 'cached',
          intentKey,
          results: ordered,
        });
      }
    }

    // 🔁 DB Intent Cache
    const cached = await checkIntent(intentKey);
    if (cached.status === 'cached') {
      const cachedResults = cached.results ?? [];

      await setProductIdsByIntent(
        intentKey,
        cachedResults.map(p => p.id)
      );

      return res.status(200).json({
        status: 'cached',
        intentKey,
        results: cachedResults,
      });
    }

    // 🆕 Create Search Record
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
      location: typeof location === 'string' ? location : undefined,
      userId: req.userId,
    });

    searchRecordId = searchRecord.id;

    // 🌐 Fetch from Serper
    const serperResults = await Promise.allSettled(
      queries.map((q: string) => searchSerper(q))
    );

    const successfulResults = serperResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value || []);

    const flatProducts: Product[] = successfulResults;

    if (!flatProducts.length) {
      return res.status(404).json({
        message: 'No products found from search',
      });
    }

    // 🚀 Upload ALL images (STRICT MODE)
    const uploadedProducts = await uploadSerperProductImages(flatProducts);

    if (!uploadedProducts.length) {
      return res.status(500).json({
        message: 'All image uploads failed. No valid products.',
      });
    }

    // 💾 Save to DB
    await setProducts(searchRecord.id, uploadedProducts);

    const savedProducts = await getProductsBySearchID(searchRecord.id);

    if (savedProducts.length) {
      await setProductIdsByIntent(
        intentKey,
        savedProducts.map(p => p.id)
      );
    }

    return res.status(200).json({
      status: 'fresh',
      intentKey,
      searchId: searchRecord.id,
      results: savedProducts,
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

    const searches = await getSearchesByUserId(req.userId);

    if (!searches.length) {
      return res.status(200).json({
        status: 'empty',
        results: [],
      });
    }

    res.status(200).json({
      status: 'cached',
      results: searches,
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

// export const updateProductMetrics = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.userId) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
//     const { productId } = req.params;

//     if (!productId || typeof productId !== 'string') {
//       return res.status(400).json({ message: 'Invalid product id' });
//     }

//     const { action } = req.body as { action?: string };
//     const normalizedAction = action?.toUpperCase();

//     if (
//       !normalizedAction ||
//       !['VIEW', 'CLICK', 'LIKE'].includes(normalizedAction)
//     ) {
//       return res.status(400).json({ message: 'Invalid action type' });
//     }

//     const updatedProduct = await updateTrendingScore(
//       productId,
//       normalizedAction as ProductMetricAction
//     );

//     return res.status(200).json({
//       status: 'success',
//       data: updatedProduct,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: 'failed to update product metrics',
//     });
//   }
// };
