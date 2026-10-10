import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { QuestionType, Difficulty, UserRole } from '@prisma/client';

const router = Router();

const createQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).min(2).max(6).default([]),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number()]),
  explanation: z.string().optional(),
  topic: z.string().min(1).max(100),
  subtopic: z.string().max(100).optional(),
  difficulty: z.nativeEnum(Difficulty),
  timeLimit: z.number().int().min(5).max(300).default(60),
  points: z.number().int().min(10).max(500).default(100),
  imageUrl: z.string().url().optional(),
  tableData: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isParameterized: z.boolean().default(false),
  parameterTemplate: z.string().optional(),
  parameterValues: z.record(z.string(), z.number()).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  numericTolerance: z.number().optional(),
});

const updateQuestionSchema = createQuestionSchema.partial();

router.get('/', asyncHandler(async (req, res) => {
  const { topic, difficulty, type, search, page = '1', limit = '50', tags } = req.query;
  const where: any = {};

  if (topic) where.topic = topic;
  if (difficulty) where.difficulty = difficulty;
  if (type) where.type = type;
  if (tags) where.tags = { hasSome: (tags as string).split(',') };
  if (search) {
    where.OR = [
      { text: { contains: search as string, mode: 'insensitive' } },
      { topic: { contains: search as string, mode: 'insensitive' } },
      { subtopic: { contains: search as string, mode: 'insensitive' } },
      { tags: { has: search as string } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        _count: { select: { variants: true, quizQuestions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    }),
    prisma.question.count({ where }),
  ]);

  res.json({ questions, total, page: parseInt(page as string), limit: parseInt(limit as string) });
}));

router.get('/topics', asyncHandler(async (_req, res) => {
  const topics = await prisma.question.groupBy({
    by: ['topic'],
    _count: { topic: true },
    orderBy: { _count: { topic: 'desc' } },
  });
  res.json({ topics: topics.map(t => ({ name: t.topic, count: t._count.topic })) });
}));

router.get('/subtopics', asyncHandler(async (req, res) => {
  const { topic } = req.query;
  const where = topic ? { topic: topic as string } : {};
  const subtopics = await prisma.question.groupBy({
    by: ['subtopic'],
    where,
    _count: { subtopic: true },
    orderBy: { _count: { subtopic: 'desc' } },
  });
  res.json({ subtopics: subtopics.filter(s => s.subtopic).map(s => ({ name: s.subtopic!, count: s._count.subtopic })) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const question = await prisma.question.findUnique({
    where: { id: req.params.id },
    include: {
      variants: { orderBy: { variantIndex: 'asc' } },
      _count: { select: { quizQuestions: true } },
    },
  });
  if (!question) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  res.json({ question });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  if (![UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN].includes(req.user!.role)) {
    throw new AppError(403, 'Only hosts and admins can create questions', 'FORBIDDEN');
  }

  const data = createQuestionSchema.parse(req.body);
  const question = await prisma.question.create({
    data: { ...data, correctAnswer: JSON.stringify(data.correctAnswer), createdBy: req.user!.id },
  });
  res.status(201).json({ question });
}));

router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  if (question.createdBy !== req.user!.id && req.user!.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Not authorized to update this question', 'FORBIDDEN');
  }

  const data = updateQuestionSchema.parse(req.body);
  const updateData: any = { ...data };
  if (data.correctAnswer !== undefined) updateData.correctAnswer = JSON.stringify(data.correctAnswer);

  const updated = await prisma.question.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json({ question: updated });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  if (question.createdBy !== req.user!.id && req.user!.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Not authorized to delete this question', 'FORBIDDEN');
  }

  await prisma.question.delete({ where: { id: req.params.id } });
  res.json({ message: 'Question deleted' });
}));

router.post('/:id/variants', asyncHandler(async (req: AuthRequest, res) => {
  const question = await prisma.question.findUnique({ where: { id: req.params.id } });
  if (!question) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
  if (!question.isParameterized) throw new AppError(400, 'Question is not parameterized', 'NOT_PARAMETERIZED');

  const { parameterValues, renderedText, renderedOptions, correctAnswer } = req.body;
  const maxIndex = await prisma.questionVariant.aggregate({
    where: { questionId: req.params.id },
    _max: { variantIndex: true },
  });

  const variant = await prisma.questionVariant.create({
    data: {
      questionId: req.params.id,
      variantIndex: (maxIndex._max.variantIndex ?? -1) + 1,
      parameterValues,
      renderedText,
      renderedOptions: renderedOptions || [],
      correctAnswer: JSON.stringify(correctAnswer),
    },
  });
  res.status(201).json({ variant });
}));

router.post('/import', asyncHandler(async (req: AuthRequest, res) => {
  if (![UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN].includes(req.user!.role)) {
    throw new AppError(403, 'Only hosts and admins can import questions', 'FORBIDDEN');
  }

  const { questions } = req.body;
  if (!Array.isArray(questions)) throw new AppError(400, 'Questions must be an array', 'INVALID_FORMAT');

  const created = [];
  for (const q of questions) {
    const parsed = createQuestionSchema.safeParse(q);
    if (!parsed.success) continue;
    const question = await prisma.question.create({
      data: { ...parsed.data, correctAnswer: JSON.stringify(parsed.data.correctAnswer), createdBy: req.user!.id },
    });
    created.push(question);
  }
  res.status(201).json({ questions: created, count: created.length });
}));

export { router as questionRouter };