/**
 * OpenAPI security scheme definitions.
 * bearerAuth — JWT passed as Authorization: Bearer <token>
 */
export const securitySchemes: Record<string, object> = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description:
      'Enter your JWT access token (obtained from /api/auth/signin or /api/auth/refresh)',
  },
};
