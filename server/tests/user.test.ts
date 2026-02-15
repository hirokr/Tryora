import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock functions
const mockFindUserById = jest.fn<any>();
const mockUpdateUserProfile = jest.fn<any>();
const mockUpdateUserPassword = jest.fn<any>();
const mockVerifyHash = jest.fn<any>();
const mockHashing = jest.fn<any>();
const mockDeleteCurrentRefreshToken = jest.fn<any>();
const mockDeleteAllRefreshTokens = jest.fn<any>();
const mockClearTokens = jest.fn<any>();
const mockVerifyAccessToken = jest.fn<any>();
const mockGetSetCache = jest.fn<any>();
const mockIsValidSession = jest.fn<any>();

// Mock database
const mockPrismaUpdate = jest.fn<any>();

// Mock modules
jest.unstable_mockModule('#src/config/google.config.ts', () => ({}));

jest.unstable_mockModule('#src/services/user.service.ts', () => ({
  findUserById: mockFindUserById,
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUserProfile: mockUpdateUserProfile,
  updateUserPassword: mockUpdateUserPassword,
  verifyUserEmail: jest.fn(),
}));

jest.unstable_mockModule('#src/utils/auth/hash.ts', () => ({
  verifyHash: mockVerifyHash,
  hashing: mockHashing,
}));

jest.unstable_mockModule('#src/utils/jwt/tokens.ts', () => ({
  verifyAccessToken: mockVerifyAccessToken,
  generateAccessToken: jest.fn(),
  clearTokens: mockClearTokens,
  generateTokens: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hasExpired: jest.fn(),
  saveToCookie: jest.fn(),
  hashTokenCrypto: jest.fn(),
  createRandomToken: jest.fn(),
}));

jest.unstable_mockModule('#src/services/token.service.ts', () => ({
  deleteCurrentRefreshToken: mockDeleteCurrentRefreshToken,
  deleteAllRefreshTokens: mockDeleteAllRefreshTokens,
  isValidSession: mockIsValidSession,
  saveRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.unstable_mockModule('#src/utils/redis.ts', () => ({
  getSetCache: mockGetSetCache,
  makeUserSessionCacheKey: (userId: string, sessionId: string) =>
    `user-session:${userId}:${sessionId}`,
  getSetRedis: jest.fn(),
  invalidateCache: jest.fn(),
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteUserCache: jest.fn(),
}));

jest.unstable_mockModule('#src/config/database.ts', () => ({
  default: {
    user: {
      update: mockPrismaUpdate,
    },
  },
}));

jest.unstable_mockModule('#src/utils/mail/sendMail.ts', () => ({
  sendVerificationEmail: jest.fn(),
}));

// Import app after mocking
const { default: app } = await import('#src/app.ts');

describe('User routes', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    emailVerified: true,
    isActive: true,
    passwordHash: 'hashed-password',
    oauthProvider: null,
    oauthId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken = 'valid-token';
  const mockAuthHeader = `Bearer ${mockToken}`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockVerifyAccessToken.mockResolvedValue({
      userId: 'user-123',
      sessionId: 'session-123',
    });

    mockGetSetCache.mockImplementation(async (_key: string, cb: any) => {
      return cb ? await cb() : true;
    });

    mockIsValidSession.mockResolvedValue(true);
  });

  describe('GET /user/profile', () => {
    it('returns user profile successfully', async () => {
      mockFindUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'user-123');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('name', 'John Doe');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('oauthProvider');
      expect(response.body).not.toHaveProperty('oauthId');
      expect(mockFindUserById).toHaveBeenCalledWith('user-123');
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(app).get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 401 when token is invalid', async () => {
      mockVerifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('returns 401 when session is invalid', async () => {
      mockIsValidSession.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid or expired session'
      );
    });

    it('returns 404 when user is not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('returns 500 when an error occurs', async () => {
      mockFindUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to fetch user profile'
      );
    });
  });

  describe('PUT /user/profile', () => {
    const updatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Jane Doe',
      avatarUrl: 'https://example.com/new-avatar.jpg',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('updates user name successfully', async () => {
      mockUpdateUserProfile.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({ name: 'Jane Doe' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Profile updated successfully'
      );
      expect(response.body.user).toHaveProperty('name', 'Jane Doe');
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          name: 'Jane Doe',
        })
      );
    });

    it('updates user avatarUrl successfully', async () => {
      mockUpdateUserProfile.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({ avatarUrl: 'https://example.com/new-avatar.jpg' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Profile updated successfully'
      );
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          avatarUrl: 'https://example.com/new-avatar.jpg',
        })
      );
    });

    it('updates both name and avatarUrl successfully', async () => {
      mockUpdateUserProfile.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({
          name: 'Jane Doe',
          avatarUrl: 'https://example.com/new-avatar.jpg',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Profile updated successfully'
      );
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          name: 'Jane Doe',
          avatarUrl: 'https://example.com/new-avatar.jpg',
        })
      );
    });

    it('returns 400 when no fields are provided', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(
        /At least one field \(name or avatarUrl\) must be provided/i
      );
    });

    it('returns 400 when avatarUrl is invalid', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({ avatarUrl: 'not-a-url' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/Invalid avatar URL/i);
    });

    it('returns 400 when name is empty', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .send({ name: 'Jane Doe' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 500 when an error occurs', async () => {
      mockUpdateUserProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', mockAuthHeader)
        .send({ name: 'Jane Doe' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to update user profile'
      );
    });
  });

  describe('POST /user/change-password', () => {
    it('changes password successfully', async () => {
      mockFindUserById.mockResolvedValue(mockUser);
      mockVerifyHash.mockResolvedValue(true);
      mockHashing.mockResolvedValue('new-hashed-password');
      mockUpdateUserPassword.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Password changed successfully'
      );
      expect(mockVerifyHash).toHaveBeenCalledWith(
        'hashed-password',
        'OldPassword1!'
      );
      expect(mockHashing).toHaveBeenCalledWith('NewPassword1!');
      expect(mockUpdateUserPassword).toHaveBeenCalledWith(
        'user-123',
        'new-hashed-password'
      );
    });

    it('returns 400 when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'DifferentPassword1!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/Passwords do not match/i);
    });

    it('returns 400 when new password is same as current password', async () => {
      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'Password1!',
          newPassword: 'Password1!',
          confirmPassword: 'Password1!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(
        /New password cannot be the same as the old password/i
      );
    });

    it('returns 400 when new password is too weak', async () => {
      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'weak',
          confirmPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('returns 400 when current password is missing', async () => {
      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/required/i);
    });

    it('returns 401 when current password is incorrect', async () => {
      mockFindUserById.mockResolvedValue(mockUser);
      mockVerifyHash.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'WrongPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Current password is incorrect'
      );
    });

    it('returns 404 when user is not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('returns 400 when user has no password (OAuth user)', async () => {
      mockFindUserById.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'User account does not have a password set'
      );
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .post('/api/user/change-password')
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 500 when an error occurs', async () => {
      mockFindUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/user/change-password')
        .set('Authorization', mockAuthHeader)
        .send({
          currentPassword: 'OldPassword1!',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to change password'
      );
    });
  });

  describe('POST /user/reset-password', () => {
    it('returns 501 as functionality is not implemented', async () => {
      const response = await request(app)
        .post('/api/user/reset-password')
        .set('Authorization', mockAuthHeader)
        .send({
          token: 'reset-token',
          newPassword: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        });

      expect(response.status).toBe(501);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/token table in database/i);
    });
  });

  describe('POST /user/verify-email', () => {
    it('returns 501 as functionality is not implemented', async () => {
      const response = await request(app)
        .post('/api/user/verify-email')
        .set('Authorization', mockAuthHeader)
        .send({ token: 'verification-token' });

      expect(response.status).toBe(501);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/token table in database/i);
    });
  });

  describe('POST /user/resend-verification-email', () => {
    it('returns 200 for unverified email', async () => {
      mockFindUserById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const response = await request(app)
        .post('/api/user/resend-verification-email')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Verification email sent successfully'
      );
      expect(mockFindUserById).toHaveBeenCalledWith('user-123');
    });

    it('returns 400 when email is already verified', async () => {
      mockFindUserById.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      const response = await request(app)
        .post('/api/user/resend-verification-email')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email is already verified'
      );
    });

    it('returns 404 when user is not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user/resend-verification-email')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(app).post(
        '/api/user/resend-verification-email'
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 500 when an error occurs', async () => {
      mockFindUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/user/resend-verification-email')
        .set('Authorization', mockAuthHeader);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to send verification email'
      );
    });
  });

  describe('DELETE /user/delete-account', () => {
    it('deletes account successfully with correct password', async () => {
      mockFindUserById.mockResolvedValue(mockUser);
      mockVerifyHash.mockResolvedValue(true);
      mockUpdateUserProfile.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        isActive: false,
      });
      mockDeleteAllRefreshTokens.mockResolvedValue(undefined);
      mockClearTokens.mockImplementation(() => {});

      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({ password: 'Password1!' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Account deleted successfully'
      );
      expect(mockVerifyHash).toHaveBeenCalledWith(
        'hashed-password',
        'Password1!'
      );
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        userId: 'user-123',
        deletedAt: expect.any(Date),
        isActive: false,
      });
      expect(mockDeleteAllRefreshTokens).toHaveBeenCalledWith('user-123');
    });

    it('returns 400 when password is not provided', async () => {
      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Password is required to delete account'
      );
    });

    it('returns 401 when password is incorrect', async () => {
      mockFindUserById.mockResolvedValue(mockUser);
      mockVerifyHash.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({ password: 'WrongPassword1!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Password is incorrect');
    });

    it('returns 404 when user is not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({ password: 'Password1!' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('returns 400 when user has no password (OAuth user)', async () => {
      mockFindUserById.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({ password: 'Password1!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Cannot delete account without password verification'
      );
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .delete('/api/user/delete-account')
        .send({ password: 'Password1!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 500 when an error occurs', async () => {
      mockFindUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/user/delete-account')
        .set('Authorization', mockAuthHeader)
        .send({ password: 'Password1!' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to delete account'
      );
    });
  });
});
