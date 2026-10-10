import { Router } from 'express';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { RoomStatus, UserRole } from '@prisma/client';

const router = Router();

router.get('/room/:roomId', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.roomId },
    include: { players: { where: { leftAt: null }, include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true }, orderBy: { score: 'desc' } } },
  });
  if (!room) throw new AppError(404, 'Room not found');
  const leaderboard = room.players.map((p, i) => ({ playerId: p.id, userId: p.userId, name: p.user?.name || p.nickname, avatarUrl: p.user?.avatarUrl, score: p.score, rank: i + 1, correctCount: p.correctCount, streak: p.streak, teamId: p.teamId, teamName: p.team?.name }));
  res.json({ leaderboard });
}));

router.get('/room/:roomId/personal/:playerId', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { players: { where: { leftAt: null }, orderBy: { score: 'desc' }, select: { id: true, userId: true, nickname: true, score: true, user: { select: { name: true, avatarUrl: true } } } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const playerIndex = room.players.findIndex(p => p.id === req.params.playerId);
  if (playerIndex === -1) throw new AppError(404, 'Player not found in room');
  const player = room.players[playerIndex];
  const nextPlayer = room.players[playerIndex - 1];
  const pointsBehind = nextPlayer ? nextPlayer.score - player.score : 0;
  res.json({ personalRank: { rank: playerIndex + 1, totalPlayers: room.players.length, score: player.score, pointsBehindNext: pointsBehind, nextPlayerName: nextPlayer ? (nextPlayer.user?.name || nextPlayer.nickname) : null } });
}));

router.get('/scope/:scope', asyncHandler(async (req, res) => {
  const { scope } = req.params;
  const { collegeId, branchId, semester, year, period = 'ALL', limit = '50', offset = '0' } = req.query;
  const where: any = { role: UserRole.STUDENT };
  if (collegeId) where.collegeId = collegeId;
  if (branchId) where.branchId = branchId;
  if (semester) where.semester = parseInt(semester as string);
  if (year) where.year = parseInt(year as string);

  if (scope === 'DAILY' || scope === 'WEEKLY' || scope === 'MONTHLY') {
    const dateFrom = new Date();
    if (scope === 'DAILY') dateFrom.setDate(dateFrom.getDate() - 1);
    else if (scope === 'WEEKLY') dateFrom.setDate(dateFrom.getDate() - 7);
    else dateFrom.setMonth(dateFrom.getMonth() - 1);
    const scores = await prisma.roomPlayer.groupBy({ by: ['userId'], where: { room: { status: RoomStatus.ENDED, endedAt: { gte: dateFrom } } }, _sum: { score: true }, _count: { userId: true }, orderBy: { _sum: { score: 'desc' } }, take: parseInt(limit as string), skip: parseInt(offset as string) });
    const userIds = scores.map(s => s.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds }, ...where }, select: { id: true, name: true, avatarUrl: true, rating: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } } });
    const leaderboard = scores.map((s, i) => { const u = users.find(user => user.id === s.userId); return { userId: s.userId, name: u?.name, avatarUrl: u?.avatarUrl, score: s._sum.score || 0, rank: parseInt(offset as string) + i + 1, quizzesPlayed: s._count.userId, college: u?.college, branch: u?.branch }; });
    return res.json({ leaderboard, total: scores.length });
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { rating: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
    select: {
      id: true, name: true, avatarUrl: true, rating: true, streak: true, longestStreak: true,
      college: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true, code: true } },
      _count: { select: { roomPlayers: { where: { room: { status: RoomStatus.ENDED } } } } }
    }
  });

  const leaderboard = users.map((u, i) => ({
    userId: u.id, name: u.name, avatarUrl: u.avatarUrl, score: u.rating,
    rank: parseInt(offset as string) + i + 1,
    quizzesPlayed: u._count.roomPlayers,
    streak: u.streak, longestStreak: u.longestStreak,
    college: u.college, branch: u.branch
  }));

  const total = await prisma.user.count({ where });
  res.json({ leaderboard, total });
}));

router.get('/college/:collegeId', asyncHandler(async (req, res) => {
  const { period = 'SEASON', limit = '20' } = req.query;
  const dateFrom = new Date();
  if (period === 'WEEKLY') dateFrom.setDate(dateFrom.getDate() - 7);
  else if (period === 'MONTHLY') dateFrom.setMonth(dateFrom.getMonth() - 1);
  const scores = await prisma.leagueScore.groupBy({ by: ['userId'], where: { collegeId: req.params.collegeId, updatedAt: { gte: dateFrom } }, _sum: { totalScore: true }, _count: { userId: true }, orderBy: { _sum: { totalScore: 'desc' } }, take: parseInt(limit as string) });
  const userIds = scores.map(s => s.userId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, avatarUrl: true, branch: { select: { id: true, name: true, code: true } } } });
  const leaderboard = scores.map((s, i) => { const u = users.find(user => user.id === s.userId); return { userId: s.userId, name: u?.name, avatarUrl: u?.avatarUrl, score: s._sum.totalScore || 0, rank: i + 1, quizzesPlayed: s._count.userId, branch: u?.branch }; });
  res.json({ leaderboard });
}));

export { router as leaderboardRouter };