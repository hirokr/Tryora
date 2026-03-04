import { Router } from 'express';
import {
  googleAuth,
  googleAuthCallback,
  googleAuthFailure,
  refresh,
  signin,
  signout,
  signup,
} from '#src/controllers/auth.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  SigninFormSchema,
  SignupFormSchema,
} from '#src/validations/auth.validation.ts';

const router = Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth2 login
 *     description: Redirects the user to Google's OAuth2 consent screen to begin authentication.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth2 consent page
 */
// Google OAuth2 routes
router.get('/google', googleAuth);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback
 *     description: Handles the callback from Google OAuth2. On success, generates JWT tokens, saves a session, and redirects to the frontend with user data and tokens as query parameters. On failure, redirects to the frontend failure page.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code returned by Google
 *     responses:
 *       302:
 *         description: Redirects to frontend with access/refresh tokens and user info on success, or to /auth/failure on error
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback', googleAuthCallback);

/**
 * @swagger
 * /api/auth/google/failure:
 *   get:
 *     summary: Google OAuth2 failure
 *     description: Handles a failed Google OAuth2 attempt and redirects the user to the frontend failure page.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirects to frontend /auth/failure page
 */
router.get('/google/failure', googleAuthFailure);

// TODO: Impement facebook and github auth routes

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new local user account, hashes the password, and sends a verification email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 description: Min 8 chars, must include a letter, a number, and a special character
 *                 example: P@ssword1
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/ReturnUserDto'
 *       400:
 *         description: Missing fields or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists
 *       500:
 *         description: Internal server error
 */
// Local auth routes
router.post('/signup', validateRequest(SignupFormSchema), signup);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in a user
 *     description: Authenticates a local user with email and password, generates JWT access and refresh tokens, and sets them as HttpOnly cookies.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 example: P@ssword1
 *     responses:
 *       200:
 *         description: Signin successful. Access and refresh tokens set as HttpOnly cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signin successful
 *                 user:
 *                   $ref: '#/components/schemas/ReturnUserDto'
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 */
router.post('/signin', validateRequest(SigninFormSchema), signin);

/**
 * @swagger
 * /api/auth/refresh:
 *   get:
 *     summary: Refresh access token
 *     description: Reads the refresh token from the HttpOnly cookie, validates it, rotates it (revokes the old one, issues a new pair), and sets updated tokens as cookies.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Token refreshed successfully. New access and refresh tokens set as HttpOnly cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token refreshed
 *       401:
 *         description: Refresh token missing, invalid, or not found in the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid refresh token
 */
// Get new access token using refresh token
router.get('/refresh', refresh);

/**
 * @swagger
 * /api/auth/signout:
 *   get:
 *     summary: Sign out the current user
 *     description: Invalidates the current session and refresh token, clears auth cookies, and destroys the server-side session. Requires a valid access token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signout successful
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Signout Success!
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not authenticated
 *       500:
 *         description: Internal server error during session destruction
 */
// Implement signout route
router.get('/signout', authMiddleware, signout);

export default router;
