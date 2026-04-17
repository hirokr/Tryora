/**
 * Shared Swagger schema definitions used across route groups.
 */
export const commonSchemas: Record<string, object> = {
  ApiErrorResponse: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        example: 'Internal server error',
      },
    },
  },
};
