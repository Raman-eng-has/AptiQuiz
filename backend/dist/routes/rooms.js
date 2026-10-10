"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../index.js");
const qrcode_1 = __importDefault(require("qrcode"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.roomRouter = router;
function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}
const createRoomSchema = zod_1.z.object({
    quizId: zod_1.z.string().uuid(),
    joinMode: zod_1.z.nativeEnum(client_1.RoomJoinMode).default(client_1.RoomJoinMode.ONLINE_LIVE),
    maxPlayers: zod_1.z.number().int().min(2).max(500).default(50),
    allowLateJoin: zod_1.z.boolean().default(true),
    requireLogin: zod_1.z.boolean().default(false),
    physicalVenue: zod_1.z.string().optional(),
    geofenceCenter: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
    geofenceRadius: zod_1.z.number().optional(),
    ipAllowlist: zod_1.z.array(zod_1.z.string()).default([]),
    qrRotationInterval: zod_1.z.number().int().min(10).max(300).default(30)
});
router.get('/', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { status, quizId, page = '1', limit = '20' } = req.query;
    const where = { hostId: req.user.id };
    if (status)
        where.status = status;
    if (quizId)
        where.quizId = quizId;
    const [rooms, total] = await Promise.all([
        index_js_1.prisma.room.findMany({
            where,
            include: { quiz: { select: { id: true, title: true, category: true } }, _count: { select: { players: true } } },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        }),
        index_js_1.prisma.room.count({ where }),
    ]);
    res.json({ rooms, total, page: parseInt(page), limit: parseInt(limit) });
}));
router.get('/public', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { status = 'WAITING', page = '1', limit = '20' } = req.query;
    const where = { status, allowLateJoin: true };
    if (status === 'WAITING')
        where.requireLogin = false;
    const [rooms, total] = await Promise.all([
        index_js_1.prisma.room.findMany({
            where,
            include: { quiz: { select: { id: true, title: true, category: true, difficulty: true, timePerQuestion: true } }, host: { select: { id: true, name: true } }, _count: { select: { players: true } } },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
        }),
        index_js_1.prisma.room.count({ where }),
    ]);
    res.json({ rooms, total, page: parseInt(page), limit: parseInt(limit) });
}));
router.get('/:id', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({
        where: { id: req.params.id },
        include: {
            quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
            host: { select: { id: true, name: true, avatarUrl: true } },
            college: { select: { id: true, name: true, code: true } },
            players: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true }, orderBy: { seatNumber: 'asc' } },
            teams: { include: { members: { include: { user: { select: { id: true, name: true } } } } } },
        },
    });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    res.json({ room });
}));
router.get('/code/:code', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({
        where: { code: req.params.code.toUpperCase() },
        include: { quiz: { select: { id: true, title: true, category: true, difficulty: true, timePerQuestion: true, shuffleOptions: true } }, host: { select: { id: true, name: true } }, _count: { select: { players: true } } },
    });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    res.json({ room });
}));
router.post('/', (0, auth_js_1.requireRole)(client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN), (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = createRoomSchema.parse(req.body);
    const quiz = await index_js_1.prisma.quiz.findUnique({ where: { id: data.quizId } });
    if (!quiz)
        throw new errorHandler_js_1.AppError(404, 'Quiz not found');
    let code = generateJoinCode();
    let exists = await index_js_1.prisma.room.findUnique({ where: { code } });
    while (exists) {
        code = generateJoinCode();
        exists = await index_js_1.prisma.room.findUnique({ where: { code } });
    }
    const room = await index_js_1.prisma.room.create({
        data: { quizId: data.quizId, joinMode: data.joinMode, maxPlayers: data.maxPlayers, allowLateJoin: data.allowLateJoin, requireLogin: data.requireLogin, physicalVenue: data.physicalVenue, geofenceCenter: data.geofenceCenter, geofenceRadius: data.geofenceRadius, ipAllowlist: data.ipAllowlist, qrRotationInterval: data.qrRotationInterval, code, hostId: req.user.id, collegeId: req.user.collegeId, currentQrCode: (0, uuid_1.v4)(), qrCodeExpiresAt: new Date(Date.now() + data.qrRotationInterval * 1000) },
        include: { quiz: { select: { id: true, title: true } } },
    });
    await index_js_1.prisma.auditLog.create({ data: { userId: req.user.id, action: 'CREATE_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
    res.status(201).json({ room });
}));
router.post('/:id/start', (0, auth_js_1.requireRole)(client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN), (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    if (room.hostId !== req.user.id)
        throw new errorHandler_js_1.AppError(403, 'Only host can start the room');
    if (room.status !== client_1.RoomStatus.WAITING)
        throw new errorHandler_js_1.AppError(400, 'Room already started or ended');
    await index_js_1.prisma.room.update({ where: { id: room.id }, data: { status: client_1.RoomStatus.LIVE, startedAt: new Date(), currentQuestionIndex: 0 } });
    await index_js_1.prisma.auditLog.create({ data: { userId: req.user.id, action: 'START_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
    res.json({ message: 'Room started' });
}));
router.post('/:id/end', (0, auth_js_1.requireRole)(client_1.UserRole.HOST, client_1.UserRole.COLLEGE_ADMIN, client_1.UserRole.SUPER_ADMIN), (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    if (room.hostId !== req.user.id)
        throw new errorHandler_js_1.AppError(403, 'Only host can end the room');
    await index_js_1.prisma.room.update({ where: { id: room.id }, data: { status: client_1.RoomStatus.ENDED, endedAt: new Date() } });
    await index_js_1.prisma.auditLog.create({ data: { userId: req.user.id, action: 'END_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
    res.json({ message: 'Room ended' });
}));
router.post('/:id/join', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id }, include: { _count: { select: { players: true } } } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    if (room.status === client_1.RoomStatus.ENDED)
        throw new errorHandler_js_1.AppError(400, 'Room has ended');
    if (!room.allowLateJoin && room.status === client_1.RoomStatus.LIVE)
        throw new errorHandler_js_1.AppError(400, 'Late join not allowed');
    if (room._count.players >= room.maxPlayers)
        throw new errorHandler_js_1.AppError(400, 'Room is full');
    if (room.requireLogin && !req.user)
        throw new errorHandler_js_1.AppError(401, 'Login required to join');
    const existing = await index_js_1.prisma.roomPlayer.findFirst({ where: { roomId: room.id, userId: req.user.id } });
    if (existing) {
        await index_js_1.prisma.roomPlayer.update({ where: { id: existing.id }, data: { isConnected: true, leftAt: null } });
        return res.json({ player: existing, message: 'Rejoined room' });
    }
    const seatNumber = await index_js_1.prisma.roomPlayer.count({ where: { roomId: room.id } }) + 1;
    const player = await index_js_1.prisma.roomPlayer.create({ data: { roomId: room.id, userId: req.user.id, seatNumber, powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'] }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } });
    res.status(201).json({ player });
}));
router.post('/join-by-code', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const { code, nickname } = req.body;
    const room = await index_js_1.prisma.room.findUnique({ where: { code: code.toUpperCase() }, include: { _count: { select: { players: true } } } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    if (room.status === client_1.RoomStatus.ENDED)
        throw new errorHandler_js_1.AppError(400, 'Room has ended');
    if (!room.allowLateJoin && room.status === client_1.RoomStatus.LIVE)
        throw new errorHandler_js_1.AppError(400, 'Late join not allowed');
    if (room._count.players >= room.maxPlayers)
        throw new errorHandler_js_1.AppError(400, 'Room is full');
    if (room.requireLogin && !req.user)
        throw new errorHandler_js_1.AppError(401, 'Login required to join');
    if (req.user) {
        const existing = await index_js_1.prisma.roomPlayer.findFirst({ where: { roomId: room.id, userId: req.user.id } });
        if (existing) {
            await index_js_1.prisma.roomPlayer.update({ where: { id: existing.id }, data: { isConnected: true, leftAt: null } });
            return res.json({ player: existing, room: { id: room.id, code: room.code, quizId: room.quizId } });
        }
    }
    const seatNumber = await index_js_1.prisma.roomPlayer.count({ where: { roomId: room.id } }) + 1;
    const player = await index_js_1.prisma.roomPlayer.create({ data: { roomId: room.id, userId: req.user?.id, nickname: nickname || req.user?.name, seatNumber, powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'] }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } });
    res.status(201).json({ player, room: { id: room.id, code: room.code, quizId: room.quizId } });
}));
router.get('/:id/qr', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
    const qrDataUrl = await qrcode_1.default.toDataURL(joinUrl, { width: 400, margin: 2 });
    res.json({ qrCode: qrDataUrl, joinCode: room.code, joinUrl });
}));
router.get('/:id/qr/export', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id }, include: { quiz: { select: { title: true } } } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
    const format = req.query.format || 'png';
    if (format === 'svg') {
        const svg = await qrcode_1.default.toString(joinUrl, { type: 'svg', width: 400, margin: 2 });
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="qr-${room.code}.svg"`);
        return res.send(svg);
    }
    const png = await qrcode_1.default.toBuffer(joinUrl, { width: 400, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${room.code}.png"`);
    res.send(png);
}));
router.post('/:id/qr/card', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const room = await index_js_1.prisma.room.findUnique({ where: { id: req.params.id }, include: { quiz: { select: { title: true, description: true, timePerQuestion: true } } } });
    if (!room)
        throw new errorHandler_js_1.AppError(404, 'Room not found');
    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
    const qrSvg = await qrcode_1.default.toString(joinUrl, { type: 'svg', width: 300, margin: 1 });
    const cardHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Join ${room.quiz.title}</title><style>@page{size:A4;margin:0}body{margin:0;padding:20mm;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.card{max-width:400px;margin:0 auto;border:2px solid #e5e7eb;border-radius:16px;padding:24px;text-align:center}.logo{font-size:28px;font-weight:800;color:#111827;margin-bottom:8px}.tagline{color:#6b7280;font-size:14px;margin-bottom:24px}.quiz-title{font-size:20px;font-weight:700;color:#111827;margin-bottom:8px}.quiz-meta{color:#6b7280;font-size:13px;margin-bottom:20px}.qr{margin:20px 0}.code{font-family:'SF Mono',Monaco,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0}.instructions{text-align:left;font-size:13px;color:#4b5563;line-height:1.8}.instructions li{margin:8px 0}.footer{margin-top:24px;font-size:11px;color:#9ca3af}</style></head><body><div class="card"><div class="logo">AptiQuiz</div><div class="tagline">Real-time Multiplayer Aptitude Quiz</div><div class="quiz-title">${room.quiz.title}</div><div class="quiz-meta">${room.quiz.description || 'Aptitude Quiz'} \u2022 ${room.quiz.timePerQuestion || 60}s per question</div><div class="qr">${qrSvg}</div><div class="code">${room.code}</div><ul class="instructions"><li>Scan QR code or visit the link below</li><li>Enter join code: <strong>${room.code}</strong></li><li>Enter your name and join the lobby</li><li>Wait for host to start the quiz</li></ul><div class="footer">AptiQuiz \u2022 ${new Date().toLocaleDateString()}</div></div></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="qr-card-${room.code}.html"`);
    res.send(cardHtml);
}));
