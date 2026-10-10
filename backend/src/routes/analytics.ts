import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { UserRole, RoomStatus } from '@prisma/client';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/room/:roomId/live', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } }, players: { where: { leftAt: null }, include: { user: { select: { id: true, name: true } } } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const currentQ = room.currentQuestionIndex >= 0 ? room.quiz.questions[room.currentQuestionIndex] : null;
  const analytics: any = { totalPlayers: room.players.length, connectedPlayers: room.players.filter(p => p.isConnected).length, currentQuestion: currentQ ? { index: room.currentQuestionIndex, text: currentQ.question.text, timeLimit: currentQ.timeLimit || currentQ.question.timeLimit, startedAt: room.questionStartTime, endsAt: room.questionEndTime } : null, answeredCount: 0, answerDistribution: {} as Record<string, number>, currentAccuracy: 0 };
  if (currentQ) { const answers = await prisma.answer.findMany({ where: { roomId: room.id, questionIndex: room.currentQuestionIndex }, select: { answer: true, isCorrect: true } }); analytics.answeredCount = answers.length; for (const a of answers) { const key = JSON.stringify(a.answer); analytics.answerDistribution[key] = (analytics.answerDistribution[key] || 0) + 1; } analytics.currentAccuracy = answers.length > 0 ? answers.filter(a => a.isCorrect).length / answers.length : 0; }
  res.json({ analytics });
}));

router.get('/room/:roomId/overview', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } }, players: { include: { user: { select: { id: true, name: true, branchId: true } } } }, roundResults: { orderBy: { questionIndex: 'asc' } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const completedPlayers = room.players.filter(p => p.leftAt).length;
  const totalPlayers = room.players.length;
  const avgScore = totalPlayers > 0 ? room.players.reduce((s, p) => s + p.score, 0) / totalPlayers : 0;
  const questionAnalytics = await Promise.all(room.quiz.questions.map(async (qq, idx) => { const answers = await prisma.answer.findMany({ where: { roomId: room.id, questionIndex: idx } }); const attemptCount = answers.length; const correctCount = answers.filter(a => a.isCorrect).length; const avgTime = attemptCount > 0 ? answers.reduce((s, a) => s + a.rttMs, 0) / attemptCount : 0; const skipCount = totalPlayers - attemptCount; return { questionIndex: idx, questionId: qq.questionId, questionText: qq.question.text.substring(0, 100), attemptCount, correctPercentage: attemptCount > 0 ? (correctCount / attemptCount) * 100 : 0, averageTime: avgTime, skipRate: totalPlayers > 0 ? (skipCount / totalPlayers) * 100 : 0, difficulty: qq.question.difficulty }; }));
  const hardestQuestions = questionAnalytics.filter(q => q.attemptCount > 0).sort((a, b) => a.correctPercentage - b.correctPercentage).slice(0, 5);
  const mostSkipped = questionAnalytics.sort((a, b) => b.skipRate - a.skipRate).slice(0, 5);
  const topicPerformance: Record<string, { total: number; correct: number; attempts: number }> = {};
  for (const qa of questionAnalytics) { const qq = room.quiz.questions[qa.questionIndex]; const topic = qq.question.topic; if (!topicPerformance[topic]) topicPerformance[topic] = { total: 0, correct: 0, attempts: 0 }; topicPerformance[topic].total += qa.attemptCount; topicPerformance[topic].correct += Math.round(qa.attemptCount * qa.correctPercentage / 100); topicPerformance[topic].attempts += 1; }
  const topicStats = Object.entries(topicPerformance).map(([topic, stats]) => ({ topic, accuracy: stats.attempts > 0 ? (stats.correct / stats.total) * 100 : 0, questions: stats.attempts }));
  const strugglingStudents = room.players.filter(p => p.correctCount / Math.max(1, room.quiz.questions.length) < 0.4).map(p => ({ playerId: p.id, name: p.user?.name || p.nickname, score: p.score, accuracy: p.correctCount / Math.max(1, room.quiz.questions.length) }));
  const integrityFlags = await prisma.integrityEvent.groupBy({ by: ['playerId', 'type'], where: { roomId: room.id }, _count: true });
  res.json({ overview: { roomId: room.id, quizTitle: room.quiz.title, status: room.status, totalPlayers, completedPlayers, completionRate: totalPlayers > 0 ? (completedPlayers / totalPlayers) * 100 : 0, averageScore: avgScore, startedAt: room.startedAt, endedAt: room.endedAt }, questionAnalytics, hardestQuestions, mostSkipped, topicStats, strugglingStudents, integrityFlags: integrityFlags.map(f => ({ playerId: f.playerId, type: f.type, count: f._count })) });
}));

router.get('/room/:roomId/export', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } }, players: { include: { user: { select: { id: true, name: true, email: true, branchId: true } }, team: true } }, roundResults: { orderBy: { questionIndex: 'asc' } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const format = (req.query.format as string) || 'csv';
  if (format === 'csv') { const headers = ['Player', 'Email', 'Branch', 'Team', 'Score', 'Correct', 'Accuracy %', 'Avg Time (ms)', 'Streak']; const rows = room.players.map(p => { const accuracy = room.quiz.questions.length > 0 ? (p.correctCount / room.quiz.questions.length) * 100 : 0; const avgTime = p.correctCount > 0 ? p.totalTime / p.correctCount : 0; return [ p.user?.name || p.nickname, p.user?.email || '', '', p.team?.name || '', p.score, p.correctCount, accuracy.toFixed(1), avgTime.toFixed(0), p.streak ]; }); const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="room-${room.code}-results.csv"`); return res.send(csv); }
  if (format === 'json') { res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Disposition', `attachment; filename="room-${room.code}-results.json"`); return res.send(JSON.stringify(room, null, 2)); }
  throw new AppError(400, 'Unsupported format');
}));

router.get('/room/:roomId/attendance', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { players: { include: { user: { select: { id: true, name: true, email: true } } } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const attendance = room.players.map(p => ({ playerId: p.id, name: p.user?.name || p.nickname, email: p.user?.email, joinedAt: p.joinedAt, leftAt: p.leftAt, duration: p.leftAt ? (new Date(p.leftAt).getTime() - new Date(p.joinedAt).getTime()) / 60000 : null, score: p.score }));
  const format = (req.query.format as string) || 'csv';
  if (format === 'csv') { const headers = ['Name', 'Email', 'Joined At', 'Left At', 'Duration (min)', 'Score']; const rows = attendance.map(a => [a.name, a.email || '', a.joinedAt.toISOString(), a.leftAt?.toISOString() || '', a.duration?.toFixed(1) || '', a.score]); const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="attendance-${room.code}.csv"`); return res.send(csv); }
  res.json({ attendance });
}));

export { router as analyticsRouter };