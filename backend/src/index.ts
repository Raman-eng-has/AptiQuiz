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
import { authMiddleware, optionalAuth } from './middleware/auth.js';

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

// Root and Health Endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'AptiQuiz REST API v1 is operational',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  const acceptsHtml = req.headers.accept?.includes('text/html');
  if (acceptsHtml) {
    const frontend = process.env.FRONTEND_URL || 'https://aptiquiz-phi.vercel.app';
    return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AptiQuiz API Server</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #030712; color: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
      .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
      .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
      h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff; }
      p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
      .links { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
      a { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s; }
      a:hover { background: #374151; border-color: #0ea5e9; }
      .meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge"><span class="dot"></span> Online & Operational</div>
      <h1>AptiQuiz API Server</h1>
      <p>The real-time multiplayer aptitude quiz REST API and Socket.IO engine is running normally.</p>
      <div class="links">
        <a href="${frontend}" target="_blank">🌐 Open AptiQuiz Web App <span>↗</span></a>
        <a href="/health">🩺 System Health Check <span>JSON</span></a>
        <a href="/api/quizzes">📝 Explore Quizzes API <span>JSON</span></a>
      </div>
      <div class="meta">
        <span>Environment: ${process.env.NODE_ENV || 'production'}</span>
        <span>Status: Healthy</span>
      </div>
    </div>
  </body>
</html>`);
  }
  res.json({
    name: 'AptiQuiz API Server',
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    frontendUrl: process.env.FRONTEND_URL || 'https://aptiquiz-phi.vercel.app',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      quizzes: '/api/quizzes',
      rooms: '/api/rooms',
      leaderboard: '/api/leaderboard',
      leagues: '/api/leagues',
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', authMiddleware, userRouter);
app.use('/api/quizzes', optionalAuth, quizRouter);
app.use('/api/questions', authMiddleware, questionRouter);
app.use('/api/rooms', optionalAuth, roomRouter);
app.use('/api/leaderboard', optionalAuth, leaderboardRouter);
app.use('/api/leagues', optionalAuth, leagueRouter);
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