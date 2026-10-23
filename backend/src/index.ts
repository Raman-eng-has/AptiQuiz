import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/users.js';
import { quizRouter } from './routes/quizzes.js';
import { questionRouter } from './routes/questions.js';
import { roomRouter } from './routes/rooms.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { leagueRouter } from './routes/leagues.js';
import { analyticsRouter } from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './socket/index.js';

// Startup check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is missing in environment variables');
}
if (!process.env.JWT_SECRET) {
  console.error('❌ Error: JWT_SECRET is missing in environment variables');
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, allowedOrigins[0]);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many requests, please try again later' } });
app.use('/api/', limiter);

app.get('/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

app.use('/api/auth', authRouter);
app.use('/api/users', authMiddleware, userRouter);
app.use('/api/quizzes', authMiddleware, quizRouter);
app.use('/api/questions', authMiddleware, questionRouter);
app.use('/api/rooms', authMiddleware, roomRouter);
app.use('/api/leaderboard', authMiddleware, leaderboardRouter);
app.use('/api/leagues', authMiddleware, leagueRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);

app.use(errorHandler);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server and Socket.IO running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});