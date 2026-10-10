"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.userRouter = router;
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    semester: zod_1.z.number().int().min(1).max(8).optional(),
    year: zod_1.z.number().int().min(1).max(4).optional(),
});
router.get('/profile', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await index_js_1.prisma.user.findUnique({
        where: { id: req.user.id },
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
    if (!user)
        throw new errorHandler_js_1.AppError(404, 'User not found', 'USER_NOT_FOUND');
    res.json({ user });
}));
router.patch('/profile', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await index_js_1.prisma.user.update({
        where: { id: req.user.id },
        data,
        select: { id: true, email: true, name: true, role: true, avatarUrl: true, collegeId: true, branchId: true, semester: true, year: true },
    });
    res.json({ user });
}));
router.get('/:id/public', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const user = await index_js_1.prisma.user.findUnique({
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
    if (!user)
        throw new errorHandler_js_1.AppError(404, 'User not found', 'USER_NOT_FOUND');
    res.json({ user });
}));
router.get('/leaderboard/global', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { scope = 'OVERALL', limit = '50', offset = '0' } = req.query;
    const users = await index_js_1.prisma.user.findMany({
        where: { role: client_1.UserRole.STUDENT },
        orderBy: { rating: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
            id: true, name: true, avatarUrl: true, rating: true,
            college: { select: { id: true, name: true, code: true } },
            branch: { select: { id: true, name: true, code: true } },
            _count: { select: { roomPlayers: { where: { room: { status: 'ENDED' } } } } },
        },
    });
    res.json({ users });
}));
router.get('/:id/stats', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
    const [quizzesPlayed, accuracy, avgTime, topicStats, recentQuizzes] = await Promise.all([
        index_js_1.prisma.roomPlayer.count({ where: { userId: targetId, room: { status: 'ENDED' } } }),
        index_js_1.prisma.answer.aggregate({
            where: { player: { userId: targetId }, room: { status: 'ENDED' } },
            _avg: { isCorrect: true },
        }),
        index_js_1.prisma.answer.aggregate({
            where: { player: { userId: targetId }, room: { status: 'ENDED' } },
            _avg: { rttMs: true },
        }),
        index_js_1.prisma.answer.groupBy({
            by: ['questionId'],
            where: { player: { userId: targetId }, room: { status: 'ENDED' } },
            _avg: { isCorrect: true },
            _count: true,
        }),
        index_js_1.prisma.roomPlayer.findMany({
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
