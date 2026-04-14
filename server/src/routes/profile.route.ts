import {
  getUserProfile,
  setUserPreferences,
  updateUserPreferences,
  uploadBodyImages,
} from '#src/controllers/Profile.controller.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: User preference and body image profile endpoints.
 */

/**
 * @swagger
 * /api/profile/body-images:
 *   post:
 *     summary: Upload user body images
 *     description: Uploads one or more body image entries for the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - poser
 *                     - imageUrl
 *                   properties:
 *                     poser:
 *                       type: string
 *                       description: Body pose label for the image.
 *                       example: front
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       example: https://cdn.example.com/body/front.jpg
 *     responses:
 *       200:
 *         description: Body images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Body images uploaded successfully
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to upload body images
 */
router.post('/body-images', uploadBodyImages);

/**
 * @swagger
 * /api/profile/preferences:
 *   post:
 *     summary: Create user preferences profile
 *     description: Creates the authenticated user's profile preferences and style metadata.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - age
 *               - ethnicity
 *               - gender
 *               - location
 *               - preferredColors
 *               - styleTags
 *               - notificationPrefs
 *             properties:
 *               age:
 *                 type: integer
 *                 example: 25
 *               ethnicity:
 *                 type: string
 *                 example: asian
 *               gender:
 *                 type: string
 *                 example: female
 *               location:
 *                 type: string
 *                 example: New York, US
 *               preferredColors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [black, beige, white]
 *               styleTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [minimal, elegant, evening]
 *               notificationPrefs:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Preferences created successfully
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to set user preferences
 */
router.post('/preferences', setUserPreferences);

/**
 * @swagger
 * /api/profile/profile:
 *   get:
 *     summary: Get user preference profile
 *     description: Returns the authenticated user's saved preference profile.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preference profile fetched
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to get user profile
 */
router.get('/profile', getUserProfile);

/**
 * @swagger
 * /api/profile/preferences:
 *   patch:
 *     summary: Update user preferences profile
 *     description: Updates existing profile preferences and style metadata for the authenticated user.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: integer
 *                 example: 26
 *               ethnicity:
 *                 type: string
 *                 example: asian
 *               gender:
 *                 type: string
 *                 example: female
 *               location:
 *                 type: string
 *                 example: San Francisco, US
 *               preferredColors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [black, navy]
 *               styleTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [smart-casual, minimalist]
 *               notificationPrefs:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to update user preferences
 */
router.patch('/preferences', updateUserPreferences);

export default router;
