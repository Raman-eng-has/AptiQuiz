import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const createSeasonSchema = z.object({
  name: z.string().min(1).max(200),
  collegeId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  quizIds: z.array(z.string().uuid()).min(1),
  pointsScheme: z.object({ win: z.number().default(100), participation: z.number().default(10), accuracyBonus: z.number().default(50) }).optional(),
});

router.get('/', asyncHandler(async (req, res) => {
  const { collegeId, isActive, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (collegeId) where.collegeId = collegeId;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [seasons, total] = await Promise.all([
    prisma.leagueSeason.findMany({
      where,
      include: { college: { select: { id: true, name: true, code: true } }, _count: { select: { scores: true } } },
      orderBy: { startDate: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    }),
    prisma.leagueSeason.count({ where }),
  ]);
  res.json({ seasons, total, page: parseInt(page as string), limit: parseInt(limit as string) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const season = await prisma.leagueSeason.findUnique({
    where: { id: req.params.id },
    include: {
      college: { select: { id: true, name: true, code: true } },
      scores: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } } } },
        orderBy: { rank: 'asc' },
      },
    },
  });
  if (!season) throw new AppError(404, 'Season not found');
  res.json({ season });
}));

router.post('/', requireRole(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const data = createSeasonSchema.parse(req.body);
  if (data.collegeId && req.user!.role === UserRole.COLLEGE_ADMIN && data.collegeId !== req.user!.collegeId) throw new AppError(403, 'Can only create seasons for your college');
  const season = await prisma.leagueSeason.create({ data: { name: data.name, collegeId: data.collegeId, startDate: new Date(data.startDate), endDate: new Date(data.endDate), quizIds: data.quizIds, pointsScheme: data.pointsScheme || { win: 100, participation: 10, accuracyBonus: 50 } }, include: { college: { select: { id: true, name: true, code: true } } } });
  res.status(201).json({ season });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const season = await prisma.leagueSeason.findUnique({ where: { id: req.params.id } });
  if (!season) throw new AppError(404, 'Season not found');
  if (req.user!.role === UserRole.COLLEGE_ADMIN && season.collegeId !== req.user!.collegeId) throw new AppError(403, 'Not authorized');
  const { name, isActive, endDate, pointsScheme } = req.body;
  const updated = await prisma.leagueSeason.update({ where: { id: req.params.id }, data: { name, isActive, endDate: endDate ? new Date(endDate) : undefined, pointsScheme }, include: { college: { select: { id: true, name: true, code: true } } } });
  res.json({ season: updated });
}));

router.post('/:id/recalculate', requireRole(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const season = await prisma.leagueSeason.findUnique({ where: { id: req.params.id }, include: { scores: { include: { user: true } } } });
  if (!season) throw new AppError(404, 'Season not found');
  if (req.user!.role === UserRole.COLLEGE_ADMIN && season.collegeId !== req.user!.collegeId) throw new AppError(403, 'Not authorized');
  const rooms = await prisma.room.findMany({ where: { quizId: { in: season.quizIds }, status: 'ENDED', endedAt: { gte: season.startDate, lte: season.endDate } }, include: { players: { include: { user: true } } } });
  const playerScores: Record<string, { totalScore: number; quizzesPlayed: number; totalCorrect: number; totalTime: number; totalQuestions: number }> = {};
  for (const room of rooms) {
    for (const player of room.players) {
      if (!player.userId) continue;
      if (!playerScores[player.userId]) playerScores[player.userId] = { totalScore: 0, quizzesPlayed: 0, totalCorrect: 0, totalTime: 0, totalQuestions: 0 };
      const ps = playerScores[player.userId];
      ps.totalScore += player.score;
      ps.quizzesPlayed += 1;
      ps.totalCorrect += player.correctCount;
      ps.totalTime += player.totalTime;
      ps.totalQuestions += 1;
    }
  }
  const updates = Object.entries(playerScores).map(([userId, stats]) => {
    const avgAccuracy = stats.totalQuestions > 0 ? stats.totalCorrect / stats.totalQuestions : 0;
    const avgTime = stats.totalQuestions > 0 ? stats.totalTime / stats.totalQuestions : 0;
    const pointsScheme = season.pointsScheme as { win: number; participation: number; accuracyBonus: number };
    const bonus = avgAccuracy > 0.8 ? pointsScheme.accuracyBonus : 0;
    const totalScore = stats.totalScore + bonus + stats.quizzesPlayed * pointsScheme.participation;
    return prisma.leagueScore.upsert({
      where: { seasonId_userId: { seasonId: season.id, userId } },
      update: { totalScore, quizzesPlayed: stats.quizzesPlayed, totalCorrect: stats.totalCorrect, averageAccuracy: avgAccuracy, averageTime: avgTime },
      create: { seasonId: season.id, userId, collegeId: season.collegeId, branchId: season.scores.find(s => s.userId === userId)?.branchId, totalScore, quizzesPlayed: stats.quizzesPlayed, totalCorrect: stats.totalCorrect, averageAccuracy: avgAccuracy, averageTime: avgTime },
    });
  });
  await Promise.all(updates);
  const allScores = await prisma.leagueScore.findMany({ where: { seasonId: season.id }, orderBy: { totalScore: 'desc' } });
  const rankUpdates = allScores.map((s, i) => prisma.leagueScore.update({ where: { id: s.id }, data: { rank: i + 1 } }));
  await Promise.all(rankUpdates);
  res.json({ message: 'Season recalculated', updated: updates.length });
}));

router.get('/:id/leaderboard', asyncHandler(async (req, res) => {
  const { scope = 'OVERALL', collegeId, branchId, limit = '50', offset = '0' } = req.query;
  const where: any = { seasonId: req.params.id };
  if (collegeId) where.collegeId = collegeId;
  if (branchId) where.branchId = branchId;
  const scores = await prisma.leagueScore.findMany({ where, include: { user: { select: { id: true, name: true, avatarUrl: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } } } }, orderBy: { totalScore: 'desc' }, take: parseInt(limit as string), skip: parseInt(offset as string) });
  const leaderboard = scores.map((s, i) => ({ userId: s.userId, name: s.user?.name, avatarUrl: s.user?.avatarUrl, score: s.totalScore, rank: parseInt(offset as string) + i + 1, quizzesPlayed: s.quizzesPlayed, accuracy: s.averageAccuracy, avgTime: s.averageTime, college: s.user?.college, branch: s.user?.branch }));
  res.json({ leaderboard });
}));

router.get('/daily-challenge/today', asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const challenge = await prisma.dailyChallenge.findUnique({ where: { date: today }, include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } } } });
  if (!challenge) return res.json({ challenge: null, message: 'No daily challenge today' });
  let userProgress = null;
  if (req.user) { const roomPlayer = await prisma.roomPlayer.findFirst({ where: { userId: req.user.id, room: { quizId: challenge.quizId, status: 'ENDED', createdAt: { gte: today } } }, include: { room: true } }); if (roomPlayer) userProgress = { score: roomPlayer.score, rank: 0, completed: true }; }
  res.json({ challenge, userProgress });
}));

export { router as leagueRouter };