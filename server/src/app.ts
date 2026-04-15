import express from 'express';
import logger from './config/logger.ts';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import redis from 'redis';
import session from 'express-session';
import passport from 'passport';

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './docs/swagger/index.ts';

import authRoutes from './routes/auth.route.ts';
import productRoutes from './routes/product.route.ts';
import usersRoutes from './routes/user.route.ts';
import model3DRoutes from './routes/3dmodel.route.ts';
import imageRoutes from './routes/image.route.ts';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Store sessions in PostgreSQL via Prisma
app.use(
  session({
    secret: 'cats',
    resave: false,
    saveUninitialized: true,
    // store: new PrismaSessionStore(),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.get('/', (req, res) => {
  logger.info('Hello from Tryora!');

  res.status(200).send('Hello from Tryora!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Tryora API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', usersRoutes);
app.use('/api', model3DRoutes);
app.use('/api', imageRoutes);
app.use('/api/products', productRoutes);

const openapiSpecification = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Redis session store setup (commented out for now)
export const redisClient = redis.createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;

// !test run
