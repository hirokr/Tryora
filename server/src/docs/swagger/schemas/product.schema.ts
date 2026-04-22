/****
 * Swagger schema definitions related to products and recommendations.
 */
export const productSchemas: Record<string, object> = {
  ProductVariant: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://cdn.example.com/products/variant-1.jpg',
      },
      variantData: {
        type: 'string',
        nullable: true,
        example: 'size:M;color:black',
      },
    },
  },

  ProductListItem: {
    type: 'object',
    required: ['id', 'title', 'defaultImageUrl'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '50f8f2d6-78c3-4e79-a9a4-a8d8ac09b2d8',
      },
      title: {
        type: 'string',
        example: 'Satin Midi Cocktail Dress',
      },
      source: {
        type: 'string',
        nullable: true,
        example: 'Zara',
      },
      defaultImageUrl: {
        type: 'string',
        format: 'uri',
        example: 'https://cdn.example.com/products/dress-1.jpg',
      },
      price: {
        type: 'string',
        nullable: true,
        example: '129.99',
      },
      viewCount: {
        type: 'integer',
        example: 84,
      },
      likeCount: {
        type: 'integer',
        example: 12,
      },
    },
  },

  ProductDetail: {
    allOf: [
      {
        $ref: '#/components/schemas/ProductListItem',
      },
      {
        type: 'object',
        properties: {
          googlelink: {
            type: 'string',
            nullable: true,
            example: 'https://www.google.com/shopping/product/12345',
          },
          rating: {
            type: 'integer',
            nullable: true,
            example: 4,
          },
          ratingCount: {
            type: 'integer',
            nullable: true,
            example: 214,
          },
          variants: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProductVariant',
            },
          },
        },
      },
    ],
  },

  ProductListSuccessResponse: {
    type: 'object',
    required: ['status', 'results'],
    properties: {
      status: {
        type: 'string',
        enum: ['success'],
      },
      results: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ProductListItem',
        },
      },
    },
  },

  ProductListEmptyResponse: {
    type: 'object',
    required: ['status', 'results'],
    properties: {
      status: {
        type: 'string',
        enum: ['empty'],
      },
      results: {
        type: 'array',
        items: {
          type: 'object',
        },
        example: [],
      },
    },
  },

  ProductDetailSuccessResponse: {
    type: 'object',
    required: ['status', 'data'],
    properties: {
      status: {
        type: 'string',
        enum: ['success'],
      },
      data: {
        $ref: '#/components/schemas/ProductDetail',
      },
    },
  },

  RecommendationItem: {
    allOf: [
      {
        $ref: '#/components/schemas/ProductListItem',
      },
      {
        type: 'object',
        properties: {
          recommendationScore: {
            type: 'number',
            example: 11.4321,
          },
        },
      },
    ],
  },

  RecommendationSuccessResponse: {
    type: 'object',
    required: ['status', 'results'],
    properties: {
      status: {
        type: 'string',
        enum: ['success'],
      },
      results: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/RecommendationItem',
        },
      },
    },
  },

  RecommendationEmptyResponse: {
    type: 'object',
    required: ['status', 'results'],
    properties: {
      status: {
        type: 'string',
        enum: ['empty'],
      },
      results: {
        type: 'array',
        items: {
          type: 'object',
        },
        example: [],
      },
    },
  },
};
