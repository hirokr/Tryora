import {
  getUserProfileId,
  setUserProfile,
  updateUserProfile,
  uploadBodyImagesService,
} from '#src/services/profile.service.ts';
import { AuthRequest } from '#src/types/authRequest.js';
import { Response } from 'express';
import { updateProfile } from './user.controller.ts';

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
