import { userSchemas } from './user.schema.ts';
import { commonSchemas } from './common.schema.ts';
import { productSchemas } from './product.schema.ts';
import { tryonSchemas } from './tryon.schema.ts';

/**
 * Aggregates all domain schema definitions into a single object
 * for use in the OpenAPI components.schemas section.
 *
 * Add new domain schema files here as the API grows:
 *   import { productSchemas } from './product.schema.ts';
 *   import { orderSchemas }   from './order.schema.ts';
 */
export const allSchemas: Record<string, object> = {
  ...commonSchemas,
  ...userSchemas,
  ...productSchemas,
  ...tryonSchemas,
};
