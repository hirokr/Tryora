import type { Options } from 'swagger-jsdoc';
import { swaggerInfo } from './info.ts';
import { allSchemas } from './schemas/index.ts';
import { securitySchemes } from './security/index.ts';

/**
 * swagger-jsdoc options.
 * Imported by app.ts and passed directly to swaggerJsdoc().
 *
 * Structure:
 *   docs/swagger/
 *     info.ts            ← openapi version, title, servers
 *     schemas/
 *       user.schema.ts   ← ReturnUserDto, UserProfile
 *       index.ts         ← merges all schemas
 *     security/
 *       index.ts         ← bearerAuth securityScheme
 *     index.ts           ← this file, final export
 */
export const swaggerOptions: Options = {
  definition: {
    ...swaggerInfo,
    components: {
      schemas: allSchemas,
      securitySchemes,
    },
  },
  // Glob patterns for files containing @swagger JSDoc annotations
  apis: ['./src/routes/*.route.ts', './routes/*.route.ts'],
};
