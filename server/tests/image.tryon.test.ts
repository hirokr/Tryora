import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockVerifyAccessToken = jest.fn<any>();
const mockGetSetCache = jest.fn<any>();
const mockIsValidSession = jest.fn<any>();
const mockCreateTryOnImagesForProducts = jest.fn<any>();

class MockImageTryOnError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ImageTryOnError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

jest.unstable_mockModule('#src/utils/jwt/tokens.ts', () => ({
  verifyAccessToken: mockVerifyAccessToken,
}));

jest.unstable_mockModule('#src/utils/redis.ts', () => ({
  getSetCache: mockGetSetCache,
  makeUserSessionCacheKey: (userId: string, sessionId: string) =>
    `user-session:${userId}:${sessionId}`,
}));

jest.unstable_mockModule('#src/services/token.service.ts', () => ({
  isValidSession: mockIsValidSession,
}));

jest.unstable_mockModule('#src/services/image.service.ts', () => ({
  createTryOnImagesForProducts: mockCreateTryOnImagesForProducts,
  ImageTryOnError: MockImageTryOnError,
}));

const { default: imageRouter } = await import('#src/routes/image.route.ts');

const app = express();
app.use(express.json());
app.use('/api', imageRouter);

describe('Try-on image route', () => {
  const authHeader = 'Bearer access-token';

  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAccessToken.mockResolvedValue({
      userId: 'user-1',
      sessionId: 'session-1',
    });

    mockGetSetCache.mockImplementation(
      async (_cacheKey: string, callback: any) => {
        return callback ? callback() : true;
      }
    );

    mockIsValidSession.mockResolvedValue(true);

    mockCreateTryOnImagesForProducts.mockResolvedValue({
      bodyImageId: 'body-1',
      images: [
        {
          tryonResultId: 'tryon-1',
          productId: 'product-1',
          imageUrl: 'https://cdn.example.com/tryon-1.png',
        },
      ],
    });
  });

  it('returns 401 when authorization header is missing', async () => {
    const response = await request(app)
      .post('/api/images/try-on')
      .send({
        productIds: ['product-1'],
        poseImageUrl: 'https://cdn.example.com/front.png',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Unauthorized');
  });

  it('returns 400 when required product ids are not provided', async () => {
    const response = await request(app)
      .post('/api/images/try-on')
      .set('Authorization', authHeader)
      .send({
        poseImageUrl: 'https://cdn.example.com/front.png',
        poser: 'front',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'message',
      'Provide at least one product id in productIds or productIdeas'
    );
  });

  it('returns 201 with generated try-on images on success', async () => {
    const response = await request(app)
      .post('/api/images/try-on')
      .set('Authorization', authHeader)
      .send({
        productIdeas: ['product-1', 'product-2'],
        poseImageUrl: 'https://cdn.example.com/front.png',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      'message',
      'Try-on image generated successfully'
    );
    expect(response.body).toHaveProperty('bodyImageId', 'body-1');
    expect(response.body).toHaveProperty(
      'imageUrl',
      'https://cdn.example.com/tryon-1.png'
    );
    expect(response.body.images).toHaveLength(1);

    expect(mockCreateTryOnImagesForProducts).toHaveBeenCalledWith({
      userId: 'user-1',
      productIds: ['product-1', 'product-2'],
      bodyImageId: undefined,
      poseImageUrl: 'https://cdn.example.com/front.png',
      poser: 'front',
      category: undefined,
    });
  });

  it('returns mapped status code for known try-on errors', async () => {
    mockCreateTryOnImagesForProducts.mockRejectedValue(
      new MockImageTryOnError('Body image not found', 404, {
        bodyImageId: 'missing-body',
      })
    );

    const response = await request(app)
      .post('/api/images/try-on')
      .set('Authorization', authHeader)
      .send({
        productIds: ['product-1'],
        bodyImageId: 'missing-body',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Body image not found',
      details: {
        bodyImageId: 'missing-body',
      },
    });
  });

  it('returns 500 for unexpected server errors', async () => {
    mockCreateTryOnImagesForProducts.mockRejectedValue(new Error('unexpected'));

    const response = await request(app)
      .post('/api/images/try-on')
      .set('Authorization', authHeader)
      .send({
        productIds: ['product-1'],
        poseImageUrl: 'https://cdn.example.com/front.png',
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty(
      'message',
      'Failed to generate try-on images'
    );
  });
});
