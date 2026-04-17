import { JobStatus, JobType } from '#src/generated/enums.ts';
import { enqueueProductImageJob } from '#src/queues/Image.queue.ts';
import { createJob } from '#src/services/job.service.ts';
import {
  findProductById,
  findVariantById,
} from '#src/services/product.service.ts';
import { getTryOnImage } from '#src/services/tryon.service.ts';
import { AuthRequest, Response } from '#src/types/authRequest.js';
import { JobResponseType } from '#src/types/Job.js';
import { editProductImage } from '#src/utils/image/imageEdit.ts';
import { tryOnImageClaid } from '#src/utils/image/imageFusion.ts';

export const updateProductAppearance = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, variantId } = req.params;
    const { userPrompt } = req.body;

    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({ message: 'Invalid user prompt' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    let url;
    if (variantId) {
      if (typeof variantId !== 'string') {
        return res.status(400).json({ message: 'Invalid variant id' });
      }
      const variant = await findVariantById(variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
      url = variant.imageUrl;
    } else {
      const product = await findProductById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      url = product.defaultImageUrl;
    }

    const startEditingImage = await editProductImage({
      productImageUrl: url,
      userPrompt,
    });
    if (!startEditingImage || !startEditingImage.data) {
      return res.status(500).json({
        message: 'Failed to start image editing',
      });
    }

    const jobStart: JobResponseType = await createJob({
      userId: req.userId,
      productId,
      variantId: variantId || undefined,
      jobType: JobType.IMAGE_EDIT,
      userPrompt,
      thirdPartyTaskId: String(startEditingImage.data.id),
      outputresultUrl: startEditingImage.data.result_url,
    });

    await enqueueProductImageJob({
      jobType: JobType.IMAGE_EDIT,
      generationJobId: jobStart.jobId,
      productId,
      params: {
        sourceImageUrl: url,
        userPrompt,
        variantId: variantId || undefined,
      },
    });

    return res.status(200).json({
      success: true,
      JobType: JobType.IMAGE_EDIT,
      status: JobStatus.QUEUED,
      jobId: jobStart.jobId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'failed to update product appearance',
    });
  }
};

export const fuseProductImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Invalid product ids' });
    }

    const [tryonImageUrl, products] = await Promise.all([
      getTryOnImage(req.userId),
      Promise.all(productIds.map((id: string) => findProductById(id))),
    ]);

    const productImageUrls = products.map(product => product?.defaultImageUrl);

    // todo: remove background from user image before fusion to improve results

    const fuseImage = await tryOnImageClaid(
      tryonImageUrl as string,
      productImageUrls as string[]
    );

    if (!fuseImage || !fuseImage.data) {
      return res.status(500).json({
        message: 'Failed to start image fusion',
      });
    }

    const jobStart: JobResponseType = await createJob({
      userId: req.userId,
      productId: productIds[0],
      variantId: undefined,
      jobType: JobType.IMAGE_TRYON,
      thirdPartyTaskId: String(fuseImage.data.id),
      outputresultUrl: fuseImage.data.result_url,
    });

    await enqueueProductImageJob({
      jobType: JobType.IMAGE_TRYON,
      generationJobId: jobStart.jobId,
      productId: productIds[0],
      params: {
        productImageUrls: productImageUrls as string[],
        baseImageUrl: tryonImageUrl as string,
      },
    });

    return res.status(200).json({
      success: true,
      JobType: JobType.IMAGE_TRYON,
      status: JobStatus.QUEUED,
      jobId: jobStart.jobId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fuse product images',
    });
  }
};
