/**
 * Swagger schema definitions related to the User domain.
 * Mirrors the ReturnUserDto TypeScript type.
 */
export const userSchemas: Record<string, object> = {
  ReturnUserDto: {
    type: 'object',
    required: ['id', 'email', 'name', 'emailVerified', 'isActive'],
    properties: {
      id: {
        type: 'string',
        example: 'clx1abc123def456',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'jane@example.com',
      },
      name: {
        type: 'string',
        example: 'Jane Doe',
      },
      avatar: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/avatar.jpg',
      },
      emailVerified: {
        type: 'boolean',
        example: false,
      },
      isActive: {
        type: 'boolean',
        example: true,
      },
    },
  },

  UserProfile: {
    type: 'object',
    description:
      'Full user profile returned from GET /profile (excludes sensitive fields)',
    required: [
      'id',
      'email',
      'name',
      'emailVerified',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: {
        type: 'string',
        example: 'clx1abc123def456',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'jane@example.com',
      },
      name: {
        type: 'string',
        example: 'Jane Doe',
      },
      avatarUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/avatar.jpg',
      },
      emailVerified: {
        type: 'boolean',
        example: true,
      },
      isActive: {
        type: 'boolean',
        example: true,
      },
      oauthProvider: {
        type: 'string',
        nullable: true,
        example: 'google',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-15T10:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-03-05T08:00:00.000Z',
      },
    },
  },
};
