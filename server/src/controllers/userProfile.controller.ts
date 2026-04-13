import {
  setUserProfile,
  uploadBodyImagesService,
} from '#src/services/profile.service.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';

// object data = {images: [{poser: 'front', imageUrl: 'http://example.com/image1.jpg'}, {poser: 'side', imageUrl: 'http://example.com/image2.jpg'}]}
export const uploadBodyImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { images } = req.body;
    await uploadBodyImagesService(req.userId, images);
    return res
      .status(200)
      .json({ message: 'Body images uploaded successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload body images' });
  }
};

export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const preferences = await setUserProfile(req.userId, req.body);
    return res.status(200).json(preferences);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get user preferences' });
  }
};
