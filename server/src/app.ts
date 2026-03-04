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

import authRoutes from './routes/auth.route.ts';
import usersRoutes from './routes/user.route.ts';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure Swagger/OpenAPI documentation
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tyora API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:8000', // Update to your port
        description: 'Development server',
      },
      {
        url: 'http://localhost:8000', // Update to your port
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        ReturnUserDto: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1abc123def456',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane@example.com',
            },
            name: {
              type: 'string',
              example: 'Jane Doe',
            },
            avatar: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            emailVerified: {
              type: 'boolean',
              example: false,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
          },
          required: ['id', 'email', 'name', 'emailVerified', 'isActive'],
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Ensure this points correctly relative to where you run the node command
  apis: ['./src/routes/*.route.ts', './routes/*.route.ts'],
};

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

app.use('/auth', authRoutes);
app.use('/api/user', usersRoutes);

const openapiSpecification = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Redis session store setup (commented out for now)
export const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
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
