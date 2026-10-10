"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.questionRouter = router;
const createQuestionSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(client_1.QuestionType),
    options: zod_1.z.array(zod_1.z.string()).min(2).max(6).default([]),
    correctAnswer: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.number()]),
    explanation: zod_1.z.string().optional(),
    topic: zod_1.z.string().min(1).max(100),
    subtopic: zod_1.z.string().max(100).optional(),
    difficulty: zod_1.z.nativeEnum(client_1.Difficulty),
    timeLimit: zod_1.z.number().int().min(5).max(300).default(60),
    points: zod_1.z.number().int().min(10).max(500).default(100),
    imageUrl: zod_1.z.string().url().optional(),
    tableData: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isParameterized: zod_1.z.boolean().default(false),
    parameterTemplate: zod_1.z.string().optional(),
    parameterValues: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
    acceptedAnswers: zod_1.z.array(zod_1.z.string()).optional(),
    numericTolerance: zod_1.z.number().optional(),
});
const updateQuestionSchema = createQuestionSchema.partial();
router.get('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { topic, difficulty, type, search, page = '1', limit = '50', tags } = req.query;
    const where = {};
    if (topic)
        where.topic = topic;
    if (difficulty)
        where.difficulty = difficulty;
    if (type)
        where.type = type;
    if (tags)
        where.tags = { hasSome: tags.split(',') };
    if (search) {
        where.OR = [
            { text: { contains: search, mode: 'insensitive' } },
            { topic: { contains: search, mode: 'insensitive' } },
            { subtopic: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
        ];
    }
    const [questions, total] = await Promise.all([
        index_js_1.prisma.question.findMany({
            where,
            include: {
                _count: { select: { variants: true, quizQuestions: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        }),
        index_js_1.prisma.question.count({ where }),
    ]);
    res.json({ questions, total, page: parseInt(page), limit: parseInt(limit) });
}));
router.get('/topics', (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
    const topics = await index_js_1.prisma.question.groupBy({
        by: ['topic'],
        _count: { topic: true },
        orderBy: { _count: { topic: 'desc' } },
    });
    res.json({ topics: topics.map(t => ({ name: t.topic, count: t._count.topic })) });
}));
router.get('/subtopics', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { topic } = req.query;
    const where = topic ? { topic: topic } : {};
    const subtopics = await index_js_1.prisma.question.groupBy({
        by: ['subtopic'],
        where,
        _count: { subtopic: true },
        orderBy: { _count: { subtopic: 'desc' } },
    });
    res.json({ subtopics: subtopics.filter(s => s.subtopic).map(s => ({ name: s.subtopic, count: s._count.subtopic })) });
}));
router.get('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await index_js_1.prisma.question.findUnique({
        where: { id: req.params.id },
        include: {
            variants: { orderBy: { variantIndex: 'asc' } },
            _count: { select: { quizQuestions: true } },
        },
    });
    if (!question)
        throw new errorHandler_js_1.AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
    res.json({ question });
}));
router.post('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    if (![client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(req.user.role)) {
        throw new errorHandler_js_1.AppError(403, 'Only hosts and admins can create questions', 'FORBIDDEN');
    }
    const data = createQuestionSchema.parse(req.body);
    const question = await index_js_1.prisma.question.create({
        data: { ...data, correctAnswer: JSON.stringify(data.correctAnswer), createdBy: req.user.id },
    });
    res.status(201).json({ question });
}));
router.patch('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await index_js_1.prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question)
        throw new errorHandler_js_1.AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
    if (question.createdBy !== req.user.id && req.user.role !== client_1.UserRole.SUPER_ADMIN) {
        throw new errorHandler_js_1.AppError(403, 'Not authorized to update this question', 'FORBIDDEN');
    }
    const data = updateQuestionSchema.parse(req.body);
    const updateData = { ...data };
    if (data.correctAnswer !== undefined)
        updateData.correctAnswer = JSON.stringify(data.correctAnswer);
    const updated = await index_js_1.prisma.question.update({
        where: { id: req.params.id },
        data: updateData,
    });
    res.json({ question: updated });
}));
router.delete('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await index_js_1.prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question)
        throw new errorHandler_js_1.AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
    if (question.createdBy !== req.user.id && req.user.role !== client_1.UserRole.SUPER_ADMIN) {
        throw new errorHandler_js_1.AppError(403, 'Not authorized to delete this question', 'FORBIDDEN');
    }
    await index_js_1.prisma.question.delete({ where: { id: req.params.id } });
    res.json({ message: 'Question deleted' });
}));
router.post('/:id/variants', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const question = await index_js_1.prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question)
        throw new errorHandler_js_1.AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');
    if (!question.isParameterized)
        throw new errorHandler_js_1.AppError(400, 'Question is not parameterized', 'NOT_PARAMETERIZED');
    const { parameterValues, renderedText, renderedOptions, correctAnswer } = req.body;
    const maxIndex = await index_js_1.prisma.questionVariant.aggregate({
        where: { questionId: req.params.id },
        _max: { variantIndex: true },
    });
    const variant = await index_js_1.prisma.questionVariant.create({
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
router.post('/import', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    if (![client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(req.user.role)) {
        throw new errorHandler_js_1.AppError(403, 'Only hosts and admins can import questions', 'FORBIDDEN');
    }
    const { questions } = req.body;
    if (!Array.isArray(questions))
        throw new errorHandler_js_1.AppError(400, 'Questions must be an array', 'INVALID_FORMAT');
    const created = [];
    for (const q of questions) {
        const parsed = createQuestionSchema.safeParse(q);
        if (!parsed.success)
            continue;
        const question = await index_js_1.prisma.question.create({
            data: { ...parsed.data, correctAnswer: JSON.stringify(parsed.data.correctAnswer), createdBy: req.user.id },
        });
        created.push(question);
    }
    res.status(201).json({ questions: created, count: created.length });
}));
