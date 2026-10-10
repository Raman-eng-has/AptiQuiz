"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.quizRouter = router;
const createQuizSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1).max(100),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    targetCollegeId: zod_1.z.string().uuid().optional(),
    targetBranchId: zod_1.z.string().uuid().optional(),
    targetSemester: zod_1.z.number().int().min(1).max(8).optional(),
    targetYear: zod_1.z.number().int().min(1).max(4).optional(),
    difficulty: zod_1.z.nativeEnum(client_1.Difficulty),
    visibility: zod_1.z.nativeEnum(client_1.QuizVisibility).default(client_1.QuizVisibility.PUBLIC),
    timePerQuestion: zod_1.z.number().int().min(5).max(300).optional(),
    totalTimeLimit: zod_1.z.number().int().min(60).max(7200).optional(),
    negativeMarking: zod_1.z.number().min(0).max(1).default(0),
    allowLateJoin: zod_1.z.boolean().default(true),
    maxPlayers: zod_1.z.number().int().min(2).max(500).default(50),
    shuffleQuestions: zod_1.z.boolean().default(false),
    shuffleOptions: zod_1.z.boolean().default(true),
    enablePowerUps: zod_1.z.boolean().default(true),
    adaptiveDifficulty: zod_1.z.boolean().default(false),
});
const updateQuizSchema = createQuizSchema.partial();
const addQuestionSchema = zod_1.z.object({ questionId: zod_1.z.string().uuid(), order: zod_1.z.number().int().optional(), timeLimit: zod_1.z.number().int().min(5).max(300).optional(), points: zod_1.z.number().int().min(10).max(500).optional() });
function isCollegeAdminOrSuper(role) {
    return role === client_1.UserRole.COLLEGE_ADMIN || role === client_1.UserRole.SUPER_ADMIN;
}
router.get('/', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const { category, difficulty, visibility, search, page = '1', limit = '20', collegeId } = req.query;
    const where = {};
    if (category)
        where.category = category;
    if (difficulty)
        where.difficulty = difficulty;
    if (visibility)
        where.visibility = visibility;
    if (collegeId)
        where.targetCollegeId = collegeId;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
        ];
    }
    const [quizzes, total] = await Promise.all([
        index_js_1.prisma.quiz.findMany({
            where,
            include: { creator: { select: { id: true, name: true } }, targetCollege: { select: { id: true, name: true, code: true } }, targetBranch: { select: { id: true, name: true, code: true } }, _count: { select: { questions: true, rooms: true } } },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        }),
        index_js_1.prisma.quiz.count({ where }),
    ]);
    res.json({ quizzes, total, page: parseInt(page), limit: parseInt(limit) });
})));
router.get('/categories', (0, errorHandler_js_1.asyncHandler)((async (_req, res) => {
    const categories = await index_js_1.prisma.quiz.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
    });
    res.json({ categories: categories.map(c => ({ name: c.category, count: c._count.category })) });
})));
router.get('/tags', (0, errorHandler_js_1.asyncHandler)((async (_req, res) => {
    const quizzes = await index_js_1.prisma.quiz.findMany({ select: { tags: true } });
    const tagCounts = {};
    for (const q of quizzes) {
        for (const tag of q.tags)
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
    const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    res.json({ tags });
})));
router.get('/:id', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({
        where: { id: req.params.id },
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            targetCollege: { select: { id: true, name: true, code: true } },
            targetBranch: { select: { id: true, name: true, code: true } },
            questions: { include: { question: true }, orderBy: { order: 'asc' } },
            _count: { select: { rooms: true } },
        },
    });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    res.json({ quiz });
})));
router.post('/', (0, auth_js_1.requireRole)(client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN), (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const data = createQuizSchema.parse(req.body);
    const quiz = await index_js_1.prisma.quiz.create({
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
            createdBy: req.user.id,
        },
        include: { creator: { select: { id: true, name: true } } },
    });
    res.status(201).json({ quiz });
})));
router.patch('/:id', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    if (quiz.createdBy !== req.user.id && !isCollegeAdminOrSuper(req.user.role))
        throw new errorHandler_js_1.AppError(403, 'Not authorized');
    const data = updateQuizSchema.parse(req.body);
    const updated = await index_js_1.prisma.quiz.update({ where: { id: req.params.id }, data, include: { creator: { select: { id: true, name: true } } } });
    res.json({ quiz: updated });
})));
router.delete('/:id', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    if (quiz.createdBy !== req.user.id && req.user.role !== client_1.UserRole.SUPER_ADMIN)
        throw new errorHandler_js_1.AppError(403, 'Not authorized');
    await index_js_1.prisma.quiz.delete({ where: { id: req.params.id } });
    res.json({ message: 'Quiz deleted' });
})));
router.post('/:id/questions', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    if (quiz.createdBy !== req.user.id && !isCollegeAdminOrSuper(req.user.role))
        throw new errorHandler_js_1.AppError(403, 'Not authorized');
    const data = addQuestionSchema.parse(req.body);
    const maxOrder = await index_js_1.prisma.quizQuestion.aggregate({ where: { quizId: req.params.id }, _max: { order: true } });
    const quizQuestion = await index_js_1.prisma.quizQuestion.create({
        data: { quizId: req.params.id, questionId: data.questionId, order: data.order ?? (maxOrder._max.order ?? -1) + 1, timeLimit: data.timeLimit, points: data.points },
        include: { question: true },
    });
    res.status(201).json({ quizQuestion });
})));
router.patch('/:quizId/questions/:questionId', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.quizId } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    if (quiz.createdBy !== req.user.id && !isCollegeAdminOrSuper(req.user.role))
        throw new errorHandler_js_1.AppError(403, 'Not authorized');
    const { order, timeLimit, points } = req.body;
    const quizQuestion = await index_js_1.prisma.quizQuestion.update({
        where: { quizId_questionId: { quizId: req.params.quizId, questionId: req.params.questionId } },
        data: { order, timeLimit, points },
        include: { question: true },
    });
    res.json({ quizQuestion });
})));
router.delete('/:quizId/questions/:questionId', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.quizId } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    if (quiz.createdBy !== req.user.id && !isCollegeAdminOrSuper(req.user.role))
        throw new errorHandler_js_1.AppError(403, 'Not authorized');
    await index_js_1.prisma.quizQuestion.delete({ where: { quizId_questionId: { quizId: req.params.quizId, questionId: req.params.questionId } } });
    res.json({ message: 'Question removed from quiz' });
})));
router.post('/:id/duplicate', (0, auth_js_1.requireRole)(client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN), (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.id }, include: { questions: { include: { question: true } } } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    const newQuiz = await index_js_1.prisma.quiz.create({
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
            visibility: client_1.QuizVisibility.PRIVATE,
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
            createdBy: req.user.id,
            questions: { create: quiz.questions.map(qq => ({ questionId: qq.questionId, order: qq.order, timeLimit: qq.timeLimit, points: qq.points })) },
        },
        include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } },
    });
    res.status(201).json({ quiz: newQuiz });
})));
router.get('/:id/export', (0, errorHandler_js_1.asyncHandler)((async (req, res) => {
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: req.params.id }, include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    const format = req.query.format || 'json';
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
    throw new errorHandler_js_1.AppError(400, 'Unsupported format');
})));
