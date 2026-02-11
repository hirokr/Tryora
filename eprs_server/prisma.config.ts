import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// @ts-ignore
const node_env = process.env.NODE_ENV || 'development';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'prisma/seed.ts',
  },
  datasource: {
    url:
      node_env === 'development'
        ? // @ts-ignore
          process.env['DATABASE_URL_LOCAL']
        : // @ts-ignore
          process.env['DATABASE_URL_CLOUD'],
  },
});
