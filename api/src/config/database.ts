import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';

const pool = new PrismaPg({
  connectionString: process.env.DATABASE_URL || './dev:sql.db',
});
const prisma = new PrismaClient({ adapter: pool });

export default prisma;
