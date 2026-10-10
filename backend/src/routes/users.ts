import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
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
  res.json({ user });
}));

router.patch('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const data = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: data.name, avatarUrl: data.avatarUrl, semester: data.semester, year: data.year },
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
      badges: { include: { badge: true }, orderBy: { earnedAt: 'desc' }, take: 20 },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}));

router.get('/leaderboard/global', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    orderBy: { rating: 'desc' },
    take: 50,
    select: { id: true, name: true, avatarUrl: true, rating: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } }, _count: { select: { roomPlayers: { where: { room: { status: 'ENDED' } } } } } },
  });
  res.json({ users });
}));

export { router as userRouter };