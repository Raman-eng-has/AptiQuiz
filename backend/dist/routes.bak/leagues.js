"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leagueRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.leagueRouter = router;
const createSeasonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    collegeId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    quizIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    pointsScheme: zod_1.z.object({
        win: zod_1.z.number().default(100),
        participation: zod_1.z.number().default(10),
        accuracyBonus: zod_1.z.number().default(50),
    }).optional(),
});
router.get('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { collegeId, isActive, page = '1', limit = '20' } = req.query;
    const where = {};
    if (collegeId)
        where.collegeId = collegeId;
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    const [seasons, total] = await Promise.all([
        index_js_1.prisma.leagueSeason.findMany({
            where,
            include: {
                college: { select: { id: true, name: true, code: true } },
                _count: { select: { scores: true } },
            },
            orderBy: { startDate: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        }),
        index_js_1.prisma.leagueSeason.count({ where }),
    ]);
    res.json({ seasons, total, page: parseInt(page), limit: parseInt(limit) });
}));
router.get('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const season = await index_js_1.prisma.leagueSeason.findUnique({
        where: { id: req.params.id },
        include: {
            college: { select: { id: true, name: true, code: true } },
            scores: {
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } } },
                },
                orderBy: { rank: 'asc' },
            },
        },
    });
    if (!season)
        throw new errorHandler_js_1.AppError(404, 'Season not found', 'SEASON_NOT_FOUND');
    res.json({ season });
}));
router.post('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    if (![client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(req.user.role)) {
        throw new errorHandler_js_1.AppError(403, 'Only college admins and super admins can create seasons', 'FORBIDDEN');
    }
    const data = createSeasonSchema.parse(req.body);
    if (data.collegeId && req.user.role === client_1.UserRole.COLLEGE_ADMIN && data.collegeId !== req.user.collegeId) {
        throw new errorHandler_js_1.AppError(403, 'Can only create seasons for your college', 'FORBIDDEN');
    }
    const season = await index_js_1.prisma.leagueSeason.create({
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            pointsScheme: data.pointsScheme || { win: 100, participation: 10, accuracyBonus: 50 },
        },
        include: { college: { select: { id: true, name: true, code: true } } },
    });
    res.status(201).json({ season });
}));
router.patch('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const season = await index_js_1.prisma.leagueSeason.findUnique({ where: { id: req.params.id } });
    if (!season)
        throw new errorHandler_js_1.AppError(404, 'Season not found', 'SEASON_NOT_FOUND');
    if (req.user.role === client_1.UserRole.COLLEGE_ADMIN && season.collegeId !== req.user.collegeId) {
        throw new errorHandler_js_1.AppError(403, 'Not authorized', 'FORBIDDEN');
    }
    const { name, isActive, endDate, pointsScheme } = req.body;
    const updated = await index_js_1.prisma.leagueSeason.update({
        where: { id: req.params.id },
        data: { name, isActive, endDate: endDate ? new Date(endDate) : undefined, pointsScheme },
        include: { college: { select: { id: true, name: true, code: true } } },
    });
    res.json({ season: updated });
}));
router.post('/:id/recalculate', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const season = await index_js_1.prisma.leagueSeason.findUnique({
        where: { id: req.params.id },
        include: { scores: { include: { user: true } } },
    });
    if (!season)
        throw new errorHandler_js_1.AppError(404, 'Season not found', 'SEASON_NOT_FOUND');
    if (req.user.role === client_1.UserRole.COLLEGE_ADMIN && season.collegeId !== req.user.collegeId) {
        throw new errorHandler_js_1.AppError(403, 'Not authorized', 'FORBIDDEN');
    }
    const rooms = await index_js_1.prisma.room.findMany({
        where: { quizId: { in: season.quizIds }, status: 'ENDED', endedAt: { gte: season.startDate, lte: season.endDate } },
        include: { players: { include: { user: true } } },
    });
    const playerScores = {};
    for (const room of rooms) {
        for (const player of room.players) {
            if (!player.userId)
                continue;
            if (!playerScores[player.userId]) {
                playerScores[player.userId] = { totalScore: 0, quizzesPlayed: 0, totalCorrect: 0, totalTime: 0, totalQuestions: 0 };
            }
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
        const pointsScheme = season.pointsScheme;
        const bonus = avgAccuracy > 0.8 ? pointsScheme.accuracyBonus : 0;
        const totalScore = stats.totalScore + bonus + stats.quizzesPlayed * pointsScheme.participation;
        return index_js_1.prisma.leagueScore.upsert({
            where: { seasonId_userId: { seasonId: season.id, userId } },
            update: { totalScore, quizzesPlayed: stats.quizzesPlayed, totalCorrect: stats.totalCorrect, averageAccuracy: avgAccuracy, averageTime: avgTime },
            create: { seasonId: season.id, userId, collegeId: season.collegeId, branchId: season.scores.find(s => s.userId === userId)?.branchId, totalScore, quizzesPlayed: stats.quizzesPlayed, totalCorrect: stats.totalCorrect, averageAccuracy: avgAccuracy, averageTime: avgTime },
        });
    });
    await Promise.all(updates);
    const allScores = await index_js_1.prisma.leagueScore.findMany({ where: { seasonId: season.id }, orderBy: { totalScore: 'desc' } });
    const rankUpdates = allScores.map((s, i) => index_js_1.prisma.leagueScore.update({ where: { id: s.id }, data: { rank: i + 1 } }));
    await Promise.all(rankUpdates);
    res.json({ message: 'Season recalculated', updated: updates.length });
}));
router.get('/:id/leaderboard', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { scope = 'OVERALL', collegeId, branchId, limit = '50', offset = '0' } = req.query;
    const where = { seasonId: req.params.id };
    if (collegeId)
        where.collegeId = collegeId;
    if (branchId)
        where.branchId = branchId;
    const scores = await index_js_1.prisma.leagueScore.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatarUrl: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } } } },
        orderBy: { totalScore: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
    });
    const leaderboard = scores.map((s, i) => ({
        userId: s.userId,
        name: s.user?.name,
        avatarUrl: s.user?.avatarUrl,
        score: s.totalScore,
        rank: parseInt(offset) + i + 1,
        quizzesPlayed: s.quizzesPlayed,
        accuracy: s.averageAccuracy,
        avgTime: s.averageTime,
        college: s.user?.college,
        branch: s.user?.branch,
    }));
    res.json({ leaderboard });
}));
router.get('/daily-challenge/today', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const challenge = await index_js_1.prisma.dailyChallenge.findUnique({
        where: { date: today },
        include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } } },
    });
    if (!challenge) {
        return res.json({ challenge: null, message: 'No daily challenge today' });
    }
    let userProgress = null;
    if (req.user) {
        const roomPlayer = await index_js_1.prisma.roomPlayer.findFirst({
            where: { userId: req.user.id, room: { quizId: challenge.quizId, status: 'ENDED', createdAt: { gte: today } } },
            include: { room: true },
        });
        if (roomPlayer) {
            userProgress = { score: roomPlayer.score, rank: 0, completed: true };
        }
    }
    res.json({ challenge, userProgress });
}));
