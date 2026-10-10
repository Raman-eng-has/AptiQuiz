import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  year: z.number().int().min(1).max(4).optional(),
});

router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, role: true, avatarUrl: true,
      collegeId: true, branchId: true, semester: true, year: true,
      rating: true, integrityScore: true, streak: true, longestStreak: true,
      createdAt: true,
      college: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { hostedRooms: true, roomPlayers: true, badges: true } },
    },
  });

  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  res.json({ user });
}));

router.patch('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, email: true, name: true, role: true, avatarUrl: true, collegeId: true, branchId: true, semester: true, year: true },
  });
  res.json({ user });
}));

router.get('/:id/public', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, avatarUrl: true, role: true,
      college: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true, code: true } },
      semester: true, year: true, rating: true, streak: true, longestStreak: true,
      createdAt: true,
      _count: { select: { roomPlayers: { where: { room: { status: 'ENDED' } } }, badges: true } },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  res.json({ user });
}));

router.get('/leaderboard/global', asyncHandler(async (req, res) => {
  const { scope = 'OVERALL', limit = '50', offset = '0' } = req.query;
  const users = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    orderBy: { rating: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
    select: {
      id: true, name: true, avatarUrl: true, rating: true,
      college: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { roomPlayers: { where: { room: { status: 'ENDED' } } } } },
    },
  });
  res.json({ users });
}));

router.get('/:id/stats', asyncHandler(async (req: AuthRequest, res) => {
  const targetId = req.params.id === 'me' ? req.user!.id : req.params.id;
  
  const [quizzesPlayed, accuracy, avgTime, topicStats, recentQuizzes] = await Promise.all([
    prisma.roomPlayer.count({ where: { userId: targetId, room: { status: 'ENDED' } } }),
    prisma.answer.aggregate({
      where: { player: { userId: targetId }, room: { status: 'ENDED' } },
      _avg: { isCorrect: true },
    }),
    prisma.answer.aggregate({
      where: { player: { userId: targetId }, room: { status: 'ENDED' } },
      _avg: { rttMs: true },
    }),
    prisma.answer.groupBy({
      by: ['questionId'],
      where: { player: { userId: targetId }, room: { status: 'ENDED' } },
      _avg: { isCorrect: true },
      _count: true,
    }),
    prisma.roomPlayer.findMany({
      where: { userId: targetId, room: { status: 'ENDED' } },
      include: { room: { include: { quiz: { select: { id: true, title: true, category: true, difficulty: true } } } } },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    stats: {
      quizzesPlayed,
      accuracy: (accuracy._avg.isCorrect || 0) * 100,
      avgTime: avgTime._avg.rttMs || 0,
      topicStats,
      recentQuizzes,
    },
  });
}));

export { router as userRouter };