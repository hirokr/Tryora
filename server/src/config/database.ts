import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client.ts';

const node_env = process.env.NODE_ENV;

// const poolDB =
//   node_env === 'development'
//     ? process.env['DATABASE_URL_LOCAL']
//     : process.env['DATABASE_URL_CLOUD'];
const poolDB = process.env.DATABASE_URL;

const pool = new PrismaPg({
  connectionString: poolDB || './dev:sql.db',
});
const prisma = new PrismaClient({ adapter: pool });

export default prisma;
