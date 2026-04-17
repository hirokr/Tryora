/**
 * Swagger schema definitions related to try-on and generation jobs.
 */
export const tryonSchemas: Record<string, object> = {
  TryonItem: {
    type: 'object',
    required: ['id', 'resultUrl', 'productIds', 'tryonType', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: 'b3e7d4dd-953b-4d42-aefe-d8d83e31394d',
      },
      resultUrl: {
        type: 'string',
        example: 'https://cdn.example.com/tryon/outputs/1.png',
      },
      productIds: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uuid',
        },
      },
      tryonType: {
        type: 'string',
        enum: ['IMAGE_TRYON', 'IMAGE_EDIT', 'MODEL'],
      },
      provider: {
        type: 'string',
        nullable: true,
        enum: ['CLAID', 'PIXAZO'],
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  TryonRecord: {
    type: 'object',
    required: ['id', 'userId', 'jobId', 'resultUrl', 'productIds', 'tryonType'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      jobId: {
        type: 'string',
        format: 'uuid',
      },
      resultUrl: {
        type: 'string',
      },
      productIds: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uuid',
        },
      },
      tryonType: {
        type: 'string',
        enum: ['IMAGE_TRYON', 'IMAGE_EDIT', 'MODEL'],
      },
      provider: {
        type: 'string',
        nullable: true,
        enum: ['CLAID', 'PIXAZO'],
      },
      isFavorite: {
        type: 'boolean',
      },
      isPublic: {
        type: 'boolean',
      },
      viewCount: {
        type: 'integer',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      deletedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },

  TryonRecordListResponse: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/TryonRecord',
    },
  },

  TryonDiscoverResponse: {
    type: 'object',
    required: ['status', 'results', 'data'],
    properties: {
      status: {
        type: 'string',
        enum: ['success'],
      },
      results: {
        type: 'integer',
        example: 2,
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/TryonItem',
        },
      },
    },
  },

  TryonModelGenerateRequest: {
    type: 'object',
    required: ['tryonId'],
    properties: {
      tryonId: {
        type: 'string',
        format: 'uuid',
        example: 'b3e7d4dd-953b-4d42-aefe-d8d83e31394d',
      },
      prompt: {
        type: 'string',
        example: 'Keep silhouette realistic and add neutral studio lighting',
      },
    },
  },

  TryonImageGenerateRequest: {
    type: 'object',
    required: ['productIds'],
    properties: {
      productIds: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  },

  TryonImageEditRequest: {
    type: 'object',
    required: ['userPrompt'],
    properties: {
      userPrompt: {
        type: 'string',
        minLength: 1,
        example:
          'Change the fabric to matte black and remove reflective highlights',
      },
    },
  },

  TryonModelQueueResponse: {
    type: 'object',
    required: ['success', 'JobType', 'status', 'jobId'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      JobType: {
        type: 'string',
        enum: ['MODEL'],
      },
      status: {
        type: 'string',
        enum: ['QUEUED'],
      },
      jobId: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  TryonImageQueueResponse: {
    type: 'object',
    required: ['success', 'JobType', 'status', 'jobId'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      JobType: {
        type: 'string',
        enum: ['IMAGE_TRYON'],
      },
      status: {
        type: 'string',
        enum: ['QUEUED'],
      },
      jobId: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  TryonImageEditQueueResponse: {
    type: 'object',
    required: ['success', 'JobType', 'status', 'jobId'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      JobType: {
        type: 'string',
        enum: ['IMAGE_EDIT'],
      },
      status: {
        type: 'string',
        enum: ['QUEUED'],
      },
      jobId: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  TryonJobStatusPayload: {
    type: 'object',
    required: ['jobId', 'status', 'jobType', 'outputresultUrl', 'tryonData'],
    properties: {
      jobId: {
        type: 'string',
        format: 'uuid',
      },
      status: {
        type: 'string',
        enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      },
      jobType: {
        type: 'string',
        enum: ['IMAGE_TRYON', 'IMAGE_EDIT', 'MODEL'],
      },
      outputresultUrl: {
        type: 'string',
        nullable: true,
      },
      tryonData: {
        type: 'object',
        nullable: true,
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          jobId: {
            type: 'string',
            format: 'uuid',
          },
          resultUrl: {
            type: 'string',
            nullable: true,
          },
          productIds: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
          },
          tryonType: {
            type: 'string',
            enum: ['IMAGE_TRYON', 'IMAGE_EDIT', 'MODEL'],
          },
          provider: {
            type: 'string',
            nullable: true,
            enum: ['CLAID', 'PIXAZO'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          isPersisted: {
            type: 'boolean',
          },
        },
      },
    },
  },

  TryonJobStatusSuccessResponse: {
    type: 'object',
    required: ['success', 'data'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        $ref: '#/components/schemas/TryonJobStatusPayload',
      },
    },
  },

  TryonJobNotFoundResponse: {
    type: 'object',
    required: ['success', 'message'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Job not found',
      },
    },
  },
};
