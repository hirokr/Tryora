import { createJob } from "#src/services/job.service.ts";
import { findProductById, findVariantById } from "#src/services/product.service.ts";
import { AuthRequest, Response } from "#src/types/authRequest.js";
import { JobResponseType } from "#src/types/Job.js";
import { editProductImage } from "#src/utils/image/imageEdit.ts";

// todo: edit image
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

    if (!productId ||typeof productId !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await findProductById(productId);
    let variant;

    if (variantId) {
      if (typeof variantId !== 'string') {
        return res.status(400).json({ message: 'Invalid variant id' });
      }
      variant = await findVariantById(variantId);
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    let url = variant ? variant.imageUrl : product.defaultImageUrl;

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
      jobType: 'IMAGE_EDIT',
      userPrompt,
      thirdPartyTaskId: startEditingImage.data.id,
      outputresultUrl: startEditingImage.data.result_url,
    });

      await enqueueProductImageEditJob({

      })


    const updatedProduct = await updateProductAppearanceInDb(
      productId,
      req.body
    );

    return res.status(200).json({
      status: 'success',
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to update product appearance',
    });
  }
};
}




// todo: image fusion
