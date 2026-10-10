"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.leaderboardRouter = router;
router.get('/room/:roomId', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: {
            players: {
                where: { leftAt: null },
                include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true },
                orderBy: { score: 'desc' },
            },
        },
    });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found', 'ROOM_NOT_FOUND');
    const leaderboard = room.players.map((p, i) => ({
        playerId: p.id,
        userId: p.userId,
        name: p.user?.name || p.nickname,
        avatarUrl: p.user?.avatarUrl,
        score: p.score,
        rank: i + 1,
        correctCount: p.correctCount,
        streak: p.streak,
        teamId: p.teamId,
        teamName: p.team?.name,
    }));
    res.json({ leaderboard });
}));
router.get('/room/:roomId/personal/:playerId', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: {
            players: {
                where: { leftAt: null },
                orderBy: { score: 'desc' },
                select: { id: true, userId: true, nickname: true, score: true, user: { select: { name: true, avatarUrl: true } } },
            },
        },
    });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found', 'ROOM_NOT_FOUND');
    const playerIndex = room.players.findIndex(p => p.id === req.params.playerId);
    if (playerIndex === -1)
        throw new errorHandler_js_1.AppError(404, 'Player not found in room', 'PLAYER_NOT_FOUND');
    const player = room.players[playerIndex];
    const nextPlayer = room.players[playerIndex - 1];
    const pointsBehind = nextPlayer ? nextPlayer.score - player.score : 0;
    res.json({
        personalRank: {
            rank: playerIndex + 1,
            totalPlayers: room.players.length,
            score: player.score,
            pointsBehindNext: pointsBehind,
            nextPlayerName: nextPlayer ? (nextPlayer.user?.name || nextPlayer.nickname) : null,
        },
    });
}));
router.get('/scope/:scope', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { scope } = req.params;
    const { collegeId, branchId, semester, year, topic, period = 'ALL', limit = '50', offset = '0' } = req.query;
    if (!Object.values(client_1.LeagueScope).includes(scope)) {
        throw new errorHandler_js_1.AppError(400, 'Invalid scope', 'INVALID_SCOPE');
    }
    const where = { role: client_1.UserRole.STUDENT };
    if (collegeId)
        where.collegeId = collegeId;
    if (branchId)
        where.branchId = branchId;
    if (semester)
        where.semester = parseInt(semester);
    if (year)
        where.year = parseInt(year);
    let orderBy = { rating: 'desc' };
    if (scope === client_1.LeagueScope.DAILY || scope === client_1.LeagueScope.WEEKLY || scope === client_1.LeagueScope.MONTHLY) {
        const dateFrom = new Date();
        if (scope === client_1.LeagueScope.DAILY)
            dateFrom.setDate(dateFrom.getDate() - 1);
        else if (scope === client_1.LeagueScope.WEEKLY)
            dateFrom.setDate(dateFrom.getDate() - 7);
        else
            dateFrom.setMonth(dateFrom.getMonth() - 1);
        const scores = await index_js_1.prisma.roomPlayer.groupBy({
            by: ['userId'],
            where: { room: { status: client_1.RoomStatus.ENDED, endedAt: { gte: dateFrom } } },
            _sum: { score: true },
            _count: { userId: true },
            orderBy: { _sum: { score: 'desc' } },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const userIds = scores.map(s => s.userId);
        const users = await index_js_1.prisma.user.findMany({
            where: { id: { in: userIds }, ...where },
            select: { id: true, name: true, avatarUrl: true, rating: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } } },
        });
        const leaderboard = scores.map((s, i) => {
            const u = users.find(user => user.id === s.userId);
            return {
                userId: s.userId,
                name: u?.name,
                avatarUrl: u?.avatarUrl,
                score: s._sum.score || 0,
                rank: parseInt(offset) + i + 1,
                quizzesPlayed: s._count.userId,
                college: u?.college,
                branch: u?.branch,
            };
        });
        return res.json({ leaderboard, total: scores.length });
    }
    const users = await index_js_1.prisma.user.findMany({
        where,
        orderBy,
        take: parseInt(limit),
        skip: parseInt(offset),
        select: { id: true, name: true, avatarUrl: true, rating: true, streak: true, longestStreak: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } }, _count: { select: { roomPlayers: { where: { room: { status: client_1.RoomStatus.ENDED } } } } } },
    });
    const leaderboard = users.map((u, i) => ({
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        score: u.rating,
        rank: parseInt(offset) + i + 1,
        quizzesPlayed: u._count.roomPlayers,
        streak: u.streak,
        longestStreak: u.longestStreak,
        college: u.college,
        branch: u.branch,
    }));
    const total = await index_js_1.prisma.user.count({ where });
    res.json({ leaderboard, total });
}));
router.get('/college/:collegeId', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { period = 'SEASON', limit = '20' } = req.query;
    const dateFrom = new Date();
    if (period === 'WEEKLY')
        dateFrom.setDate(dateFrom.getDate() - 7);
    else if (period === 'MONTHLY')
        dateFrom.setMonth(dateFrom.getMonth() - 1);
    const scores = await index_js_1.prisma.leagueScore.groupBy({
        by: ['userId'],
        where: { collegeId: req.params.collegeId, updatedAt: { gte: dateFrom } },
        _sum: { totalScore: true },
        _count: { userId: true },
        orderBy: { _sum: { totalScore: 'desc' } },
        take: parseInt(limit),
    });
    const userIds = scores.map(s => s.userId);
    const users = await index_js_1.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatarUrl: true, branch: { select: { id: true, name: true, code: true } } },
    });
    const leaderboard = scores.map((s, i) => {
        const u = users.find(user => user.id === s.userId);
        return {
            userId: s.userId,
            name: u?.name,
            avatarUrl: u?.avatarUrl,
            score: s._sum.totalScore || 0,
            rank: i + 1,
            quizzesPlayed: s._count.userId,
            branch: u?.branch,
        };
    });
    res.json({ leaderboard });
}));
