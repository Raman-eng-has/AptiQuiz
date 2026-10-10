"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.userRouter = router;
router.get('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
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
    res.json({ user });
}));
router.patch('/profile', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const user = await index_js_1.prisma.user.update({
        where: { id: req.user.id },
        data: { name: data.name, avatarUrl: data.avatarUrl, semester: data.semester, year: data.year },
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
            badges: { include: { badge: true }, orderBy: { earnedAt: 'desc' }, take: 20 },
        },
    });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json({ user });
}));
router.get('/leaderboard/global', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const users = await index_js_1.prisma.user.findMany({
        where: { role: client_1.UserRole.STUDENT },
        orderBy: { rating: 'desc' },
        take: 50,
        select: { id: true, name: true, avatarUrl: true, rating: true, college: { select: { id: true, name: true, code: true } }, branch: { select: { id: true, name: true, code: true } }, _count: { select: { roomPlayers: { where: { room: { status: 'ENDED' } } } } } },
    });
    res.json({ users });
}));
