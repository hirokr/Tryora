import {
  getUserProfileId,
  setUserProfile,
  updateUserProfile,
  uploadBodyImagesService,
} from '#src/services/profile.service.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import { uploadToUploadThing } from '#src/utils/image/image.ts';
import { removeBackground } from '#src/utils/image/removeBg.ts';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

type BodyImageInput = {
  poser: string;
  imageUrl: string;
};

const getExtensionFromContentType = (contentType: string) => {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return 'jpg';
  }

  if (contentType.includes('webp')) {
    return 'webp';
  }

  if (contentType.includes('png')) {
    return 'png';
  }

  return 'jpg';
};

const getExtensionFromUrl = (imageUrl: string) => {
  try {
    const pathname = new URL(imageUrl).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();

    if (extension && extension.length <= 5) {
      return extension;
    }
  } catch {
    return null;
  }

  return null;
};

const processAndUploadImage = async (userId: string, image: BodyImageInput) => {
  const response = await fetch(image.imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download image (${response.status} ${response.statusText})`
    );
  }

  const originalBytes = Buffer.from(await response.arrayBuffer());

  if (!originalBytes.length) {
    throw new Error('Downloaded image is empty');
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const urlExtension = getExtensionFromUrl(image.imageUrl);
  const extension = urlExtension || getExtensionFromContentType(contentType);
  const fileKey = `${Date.now()}_${randomUUID()}_${image.poser}`;
  const inputPath = join(tmpdir(), `${fileKey}.${extension}`);
  const outputPath = join(tmpdir(), `${fileKey}_no_bg.png`);

  try {
    await writeFile(inputPath, originalBytes);
    await removeBackground(inputPath, outputPath);

    const processedBytes = await readFile(outputPath);
    const uploadedImage = await uploadToUploadThing(
      processedBytes,
      `body-image-${userId}-${randomUUID()}.png`,
      'image/png'
    );

    return {
      poser: image.poser,
      imageUrl: uploadedImage.url,
    };
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
};

// object data = {images: [{poser: 'front', imageUrl: 'http://example.com/image1.jpg'}, {poser: 'side', imageUrl: 'http://example.com/image2.jpg'}]}
export const uploadBodyImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const images = (req.body as { images?: BodyImageInput[] })?.images;

    if (!Array.isArray(images) || images.length === 0) {
      return res
        .status(400)
        .json({ message: 'images must be a non-empty array' });
    }

    const hasInvalidItem = images.some(
      image =>
        !image ||
        typeof image.poser !== 'string' ||
        !image.poser.trim() ||
        typeof image.imageUrl !== 'string' ||
        !image.imageUrl.trim()
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        message: 'Each image must include non-empty poser and imageUrl strings',
      });
    }

    const processedImages: BodyImageInput[] = [];

    // for (const image of images) {
    //   const processedImage = await processAndUploadImage(req.userId, image);
    //   processedImages.push(processedImage);
    // }

    await uploadBodyImagesService(req.userId, images);
    return res.status(200).json({
      message: 'Body images uploaded successfully',
      images: processedImages,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload body images' });
  }
};

export const setUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const preferences = await setUserProfile(req.userId, req.body);
    return res.status(200).json(preferences);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to set user preferences' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const profile = await getUserProfileId(req.userId);
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get user profile' });
  }
};

export const updateUserPreferences = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const updatedProfile = await updateUserProfile(req.userId, req.body);
    return res.status(200).json(updatedProfile);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to update user preferences' });
  }
};
