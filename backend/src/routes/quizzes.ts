import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { Difficulty, QuizVisibility, QuestionType, UserRole } from '@prisma/client';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  targetCollegeId: z.string().uuid().optional(),
  targetBranchId: z.string().uuid().optional(),
  targetSemester: z.number().int().min(1).max(8).optional(),
  targetYear: z.number().int().min(1).max(4).optional(),
  difficulty: z.nativeEnum(Difficulty),
  visibility: z.nativeEnum(QuizVisibility).default(QuizVisibility.PUBLIC),
  timePerQuestion: z.number().int().min(5).max(300).optional(),
  totalTimeLimit: z.number().int().min(60).max(7200).optional(),
  negativeMarking: z.number().min(0).max(1).default(0),
  allowLateJoin: z.boolean().default(true),
  maxPlayers: z.number().int().min(2).max(500).default(50),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(true),
  enablePowerUps: z.boolean().default(true),
  adaptiveDifficulty: z.boolean().default(false),
});

const updateQuizSchema = createQuizSchema.partial();
const addQuestionSchema = z.object({ questionId: z.string().uuid(), order: z.number().int().optional(), timeLimit: z.number().int().min(5).max(300).optional(), points: z.number().int().min(10).max(500).optional() });

function isCollegeAdminOrSuper(role: UserRole): boolean {
  return role === UserRole.COLLEGE_ADMIN || role === UserRole.SUPER_ADMIN;
}

router.get('/', asyncHandler((async (req, res) => {
  const { category, difficulty, visibility, search, page = '1', limit = '20', collegeId } = req.query;
  const where: any = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (visibility) where.visibility = visibility;
  if (collegeId) where.targetCollegeId = collegeId;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { tags: { has: search as string } },
    ];
  }
  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: { creator: { select: { id: true, name: true } }, targetCollege: { select: { id: true, name: true, code: true } }, targetBranch: { select: { id: true, name: true, code: true } }, _count: { select: { questions: true, rooms: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    }),
    prisma.quiz.count({ where }),
  ]);
  res.json({ quizzes, total, page: parseInt(page as string), limit: parseInt(limit as string) });
})));

router.get('/categories', asyncHandler((async (_req, res) => {
  const categories = await prisma.quiz.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  res.json({ categories: categories.map(c => ({ name: c.category, count: c._count.category })) });
})));

router.get('/tags', asyncHandler((async (_req, res) => {
  const quizzes = await prisma.quiz.findMany({ select: { tags: true } });
  const tagCounts: Record<string, number> = {};
  for (const q of quizzes) {
    for (const tag of q.tags) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  res.json({ tags });
})));

router.get('/:id', asyncHandler((async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      targetCollege: { select: { id: true, name: true, code: true } },
      targetBranch: { select: { id: true, name: true, code: true } },
      questions: { include: { question: true }, orderBy: { order: 'asc' } },
      _count: { select: { rooms: true } },
    },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  res.json({ quiz });
})));

router.get('/:id/qr', asyncHandler((async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    select: { id: true, title: true, category: true, difficulty: true },
  });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  const QRCode = (await import('qrcode')).default;
  const quizUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/quiz/${quiz.id}`;
  const qrDataUrl = await QRCode.toDataURL(quizUrl, { width: 400, margin: 2 });
  res.json({ qrCode: qrDataUrl, quizId: quiz.id, title: quiz.title, quizUrl });
})));

router.post('/', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler((async (req: AuthRequest, res) => {
  const data = createQuizSchema.parse(req.body);
  const quiz = await prisma.quiz.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      targetCollegeId: data.targetCollegeId,
      targetBranchId: data.targetBranchId,
      targetSemester: data.targetSemester,
      targetYear: data.targetYear,
      difficulty: data.difficulty,
      visibility: data.visibility,
      timePerQuestion: data.timePerQuestion,
      totalTimeLimit: data.totalTimeLimit,
      negativeMarking: data.negativeMarking,
      allowLateJoin: data.allowLateJoin,
      maxPlayers: data.maxPlayers,
      shuffleQuestions: data.shuffleQuestions,
      shuffleOptions: data.shuffleOptions,
      enablePowerUps: data.enablePowerUps,
      adaptiveDifficulty: data.adaptiveDifficulty,
      createdBy: req.user!.id,
    },
    include: { creator: { select: { id: true, name: true } } },
  });
  res.status(201).json({ quiz });
})));

router.patch('/:id', asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.createdBy !== req.user!.id && !isCollegeAdminOrSuper(req.user!.role)) throw new AppError(403, 'Not authorized');
  const data = updateQuizSchema.parse(req.body);
  const updated = await prisma.quiz.update({ where: { id: req.params.id }, data, include: { creator: { select: { id: true, name: true } } } });
  res.json({ quiz: updated });
})));

router.delete('/:id', asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.createdBy !== req.user!.id && req.user!.role !== UserRole.SUPER_ADMIN) throw new AppError(403, 'Not authorized');
  await prisma.quiz.delete({ where: { id: req.params.id } });
  res.json({ message: 'Quiz deleted' });
})));

router.post('/:id/questions', asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.createdBy !== req.user!.id && !isCollegeAdminOrSuper(req.user!.role)) throw new AppError(403, 'Not authorized');
  const data = addQuestionSchema.parse(req.body);
  const maxOrder = await prisma.quizQuestion.aggregate({ where: { quizId: req.params.id }, _max: { order: true } });
  const quizQuestion = await prisma.quizQuestion.create({
    data: { quizId: req.params.id, questionId: data.questionId, order: data.order ?? (maxOrder._max.order ?? -1) + 1, timeLimit: data.timeLimit, points: data.points },
    include: { question: true },
  });
  res.status(201).json({ quizQuestion });
})));

router.patch('/:quizId/questions/:questionId', asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.createdBy !== req.user!.id && !isCollegeAdminOrSuper(req.user!.role)) throw new AppError(403, 'Not authorized');
  const { order, timeLimit, points } = req.body;
  const quizQuestion = await prisma.quizQuestion.update({
    where: { quizId_questionId: { quizId: req.params.quizId, questionId: req.params.questionId } },
    data: { order, timeLimit, points },
    include: { question: true },
  });
  res.json({ quizQuestion });
})));

router.delete('/:quizId/questions/:questionId', asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (quiz.createdBy !== req.user!.id && !isCollegeAdminOrSuper(req.user!.role)) throw new AppError(403, 'Not authorized');
  await prisma.quizQuestion.delete({ where: { quizId_questionId: { quizId: req.params.quizId, questionId: req.params.questionId } } });
  res.json({ message: 'Question removed from quiz' });
})));

router.post('/:id/duplicate', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler((async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id }, include: { questions: { include: { question: true } } } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  const newQuiz = await prisma.quiz.create({
    data: {
      title: `${quiz.title} (Copy)`,
      description: quiz.description,
      category: quiz.category,
      tags: quiz.tags,
      targetCollegeId: quiz.targetCollegeId,
      targetBranchId: quiz.targetBranchId,
      targetSemester: quiz.targetSemester,
      targetYear: quiz.targetYear,
      difficulty: quiz.difficulty,
      visibility: QuizVisibility.PRIVATE,
      timePerQuestion: quiz.timePerQuestion,
      totalTimeLimit: quiz.totalTimeLimit,
      negativeMarking: quiz.negativeMarking,
      allowLateJoin: quiz.allowLateJoin,
      maxPlayers: quiz.maxPlayers,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      enablePowerUps: quiz.enablePowerUps,
      adaptiveDifficulty: quiz.adaptiveDifficulty,
      isPublished: false,
      createdBy: req.user!.id,
      questions: { create: quiz.questions.map(qq => ({ questionId: qq.questionId, order: qq.order, timeLimit: qq.timeLimit, points: qq.points })) },
    },
    include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } },
  });
  res.status(201).json({ quiz: newQuiz });
})));

router.get('/:id/export', asyncHandler((async (req, res) => {
  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id }, include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  const format = (req.query.format as string) || 'json';
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}.json"`);
    return res.send(JSON.stringify(quiz, null, 2));
  }
  if (format === 'csv') {
    const headers = ['Order', 'Question Text', 'Type', 'Options', 'Correct Answer', 'Explanation', 'Topic', 'Difficulty', 'Time Limit', 'Points'];
    const rows = quiz.questions.map((qq) => [
      qq.order,
      qq.question.text.replace(/"/g, '""'),
      qq.question.type,
      qq.question.options.join(' | ').replace(/"/g, '""'),
      JSON.stringify(qq.question.correctAnswer).replace(/"/g, '""'),
      (qq.question.explanation || '').replace(/"/g, '""'),
      qq.question.topic,
      qq.question.difficulty,
      qq.timeLimit || qq.question.timeLimit,
      qq.points || qq.question.points,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title}.csv"`);
    return res.send(csv);
  }
  throw new AppError(400, 'Unsupported format');
})));

export { router as quizRouter };