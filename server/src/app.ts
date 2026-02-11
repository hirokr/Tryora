import express from 'express';
import logger from './config/logger.ts';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import session from 'express-session';
import passport from 'passport';

import authRoutes from './routes/auth.router.ts';
// import { PrismaSessionStore } from './services/session.service.ts';

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
  logger.info('Hello from Ai Shop!');

  res.status(200).send('Hello from Ai Shop!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Ai Shop API is running!' });
});

app.use('/auth', authRoutes);
// app.use("/api/users", usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
