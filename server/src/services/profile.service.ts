import prisma from '#src/config/database.ts';
import { userbodyimage, userProfile } from '#src/types/profile.js';

export async function uploadBodyImagesService(
  userId: string,
  imageUrls: userbodyimage[]
) {
  try {
    const existingImages = await prisma.userBodyImage.findMany({
      where: { userId },
    });

    const existingImageUrls = existingImages.map(img => img.imageUrl);
    const newImageUrls = imageUrls.filter(
      url => !existingImageUrls.includes(url.imageUrl)
    );

    const imagesToCreate = newImageUrls.map(url => ({
      userId,
      imageUrl: url.imageUrl,
      poseData: { poser: url.poser },
      metadata: { poser: url.poser },
    }));

    if (imagesToCreate.length > 0) {
      await prisma.userBodyImage.createMany({
        data: imagesToCreate,
      });
    }

    return { message: 'Body images uploaded successfully' };
  } catch (err) {
    console.error('Error uploading body images:', err);
    throw err;
  }
}

export async function setUserProfile(userId: string, profileData: userProfile) {
  try {
    const {
      age,
      ethnicity,
      gender,
      location,
      preferredColors,
      styleTags,
      notificationPrefs,
    } = profileData;

    const updatedProfile = await prisma.userProfile.create({
      data: {
        userId,
        age,
        ethnicity,
        gender,
        location,
        preferredColors,
        styleTags,
        notificationPrefs,
      },
    });

    return updatedProfile;
  } catch (error) {
    console.error('Error setting user profile:', error);
    throw error;
  }
}

export async function getUserProfileId(userId: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    return profile;
  } catch (error) {
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: userProfile
) {
  try {
    const {
      age,
      ethnicity,
      gender,
      location,
      preferredColors,
      styleTags,
      notificationPrefs,
    } = profileData;

    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        age,
        ethnicity,
        gender,
        location,
        preferredColors,
        styleTags,
        notificationPrefs,
      },
    });

    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
