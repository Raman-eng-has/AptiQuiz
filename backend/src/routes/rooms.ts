import { Router } from 'express';
import { prisma } from '../index.js';
import QRCode from 'qrcode';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { RoomJoinMode, RoomStatus, UserRole } from '@prisma/client';
import { requireRole } from '../middleware/auth.js';

const router = Router();

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const createRoomSchema = z.object({
  quizId: z.string().uuid(),
  joinMode: z.nativeEnum(RoomJoinMode).default(RoomJoinMode.ONLINE_LIVE),
  maxPlayers: z.number().int().min(2).max(500).default(50),
  allowLateJoin: z.boolean().default(true),
  requireLogin: z.boolean().default(false),
  physicalVenue: z.string().optional(),
  geofenceCenter: z.object({ lat: z.number(), lng: z.number() }).optional(),
  geofenceRadius: z.number().optional(),
  ipAllowlist: z.array(z.string()).default([]),
  qrRotationInterval: z.number().int().min(10).max(300).default(30)
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { status, quizId, page = '1', limit = '20' } = req.query;
  const where: any = { hostId: req.user!.id };
  if (status) where.status = status;
  if (quizId) where.quizId = quizId;
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: { quiz: { select: { id: true, title: true, category: true } }, _count: { select: { players: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    }),
    prisma.room.count({ where }),
  ]);
  res.json({ rooms, total, page: parseInt(page as string), limit: parseInt(limit as string) });
}));

router.get('/public', asyncHandler(async (req, res) => {
  const { status = 'WAITING', page = '1', limit = '20' } = req.query;
  const where: any = { status, allowLateJoin: true };
  if (status === 'WAITING') where.requireLogin = false;
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: { quiz: { select: { id: true, title: true, category: true, difficulty: true, timePerQuestion: true } }, host: { select: { id: true, name: true } }, _count: { select: { players: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    }),
    prisma.room.count({ where }),
  ]);
  res.json({ rooms, total, page: parseInt(page as string), limit: parseInt(limit as string) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    include: {
      quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
      host: { select: { id: true, name: true, avatarUrl: true } },
      college: { select: { id: true, name: true, code: true } },
      players: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true }, orderBy: { seatNumber: 'asc' } },
      teams: { include: { members: { include: { user: { select: { id: true, name: true } } } } } },
    },
  });
  if (!room) throw new AppError(404, 'Room not found');
  res.json({ room });
}));

router.get('/code/:code', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: { quiz: { select: { id: true, title: true, category: true, difficulty: true, timePerQuestion: true, shuffleOptions: true } }, host: { select: { id: true, name: true } }, _count: { select: { players: true } } },
  });
  if (!room) throw new AppError(404, 'Room not found');
  res.json({ room });
}));

router.post('/', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const data = createRoomSchema.parse(req.body);
  const quiz = await prisma.quiz.findUnique({ where: { id: data.quizId } });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  let code = generateJoinCode();
  let exists = await prisma.room.findUnique({ where: { code } });
  while (exists) { code = generateJoinCode(); exists = await prisma.room.findUnique({ where: { code } }); }
  const room = await prisma.room.create({
    data: { quizId: data.quizId, joinMode: data.joinMode, maxPlayers: data.maxPlayers, allowLateJoin: data.allowLateJoin, requireLogin: data.requireLogin, physicalVenue: data.physicalVenue, geofenceCenter: data.geofenceCenter, geofenceRadius: data.geofenceRadius, ipAllowlist: data.ipAllowlist, qrRotationInterval: data.qrRotationInterval, code, hostId: req.user!.id, collegeId: req.user!.collegeId, currentQrCode: uuidv4(), qrCodeExpiresAt: new Date(Date.now() + data.qrRotationInterval * 1000) },
    include: { quiz: { select: { id: true, title: true } } },
  });
  await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'CREATE_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
  res.status(201).json({ room });
}));

router.post('/:id/start', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) throw new AppError(404, 'Room not found');
  if (room.hostId !== req.user!.id) throw new AppError(403, 'Only host can start the room');
  if (room.status !== RoomStatus.WAITING) throw new AppError(400, 'Room already started or ended');
  await prisma.room.update({ where: { id: room.id }, data: { status: RoomStatus.LIVE, startedAt: new Date(), currentQuestionIndex: 0 } });
  await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'START_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
  res.json({ message: 'Room started' });
}));

router.post('/:id/end', requireRole(UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) throw new AppError(404, 'Room not found');
  if (room.hostId !== req.user!.id) throw new AppError(403, 'Only host can end the room');
  await prisma.room.update({ where: { id: room.id }, data: { status: RoomStatus.ENDED, endedAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'END_ROOM', entityType: 'Room', entityId: room.id, roomId: room.id } });
  res.json({ message: 'Room ended' });
}));

router.post('/:id/join', asyncHandler(async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id }, include: { _count: { select: { players: true } } } });
  if (!room) throw new AppError(404, 'Room not found');
  if (room.status === RoomStatus.ENDED) throw new AppError(400, 'Room has ended');
  if (!room.allowLateJoin && room.status === RoomStatus.LIVE) throw new AppError(400, 'Late join not allowed');
  if (room._count.players >= room.maxPlayers) throw new AppError(400, 'Room is full');
  if (room.requireLogin && !req.user) throw new AppError(401, 'Login required to join');
  const existing = await prisma.roomPlayer.findFirst({ where: { roomId: room.id, userId: req.user!.id } });
  if (existing) { await prisma.roomPlayer.update({ where: { id: existing.id }, data: { isConnected: true, leftAt: null } }); return res.json({ player: existing, message: 'Rejoined room' }); }
  const seatNumber = await prisma.roomPlayer.count({ where: { roomId: room.id } }) + 1;
  const player = await prisma.roomPlayer.create({ data: { roomId: room.id, userId: req.user!.id, seatNumber, powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'] }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } });
  res.status(201).json({ player });
}));

router.post('/join-by-code', asyncHandler(async (req: AuthRequest, res) => {
  const { code, nickname } = req.body;
  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() }, include: { _count: { select: { players: true } } } });
  if (!room) throw new AppError(404, 'Room not found');
  if (room.status === RoomStatus.ENDED) throw new AppError(400, 'Room has ended');
  if (!room.allowLateJoin && room.status === RoomStatus.LIVE) throw new AppError(400, 'Late join not allowed');
  if (room._count.players >= room.maxPlayers) throw new AppError(400, 'Room is full');
  if (room.requireLogin && !req.user) throw new AppError(401, 'Login required to join');
  if (req.user) { const existing = await prisma.roomPlayer.findFirst({ where: { roomId: room.id, userId: req.user.id } }); if (existing) { await prisma.roomPlayer.update({ where: { id: existing.id }, data: { isConnected: true, leftAt: null } }); return res.json({ player: existing, room: { id: room.id, code: room.code, quizId: room.quizId } }); } }
  const seatNumber = await prisma.roomPlayer.count({ where: { roomId: room.id } }) + 1;
  const player = await prisma.roomPlayer.create({ data: { roomId: room.id, userId: req.user?.id, nickname: nickname || req.user?.name, seatNumber, powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'] }, include: { user: { select: { id: true, name: true, avatarUrl: true } } } });
  res.status(201).json({ player, room: { id: room.id, code: room.code, quizId: room.quizId } });
}));

router.get('/:id/qr', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) throw new AppError(404, 'Room not found');
  const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 400, margin: 2 });
  res.json({ qrCode: qrDataUrl, joinCode: room.code, joinUrl });
}));

router.get('/:id/qr/export', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id }, include: { quiz: { select: { title: true } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
  const format = (req.query.format as string) || 'png';
  if (format === 'svg') { const svg = await QRCode.toString(joinUrl, { type: 'svg', width: 400, margin: 2 }); res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Content-Disposition', `attachment; filename="qr-${room.code}.svg"`); return res.send(svg); }
  const png = await QRCode.toBuffer(joinUrl, { width: 400, margin: 2 });
  res.setHeader('Content-Type', 'image/png'); res.setHeader('Content-Disposition', `attachment; filename="qr-${room.code}.png"`); res.send(png);
}));

router.post('/:id/qr/card', asyncHandler(async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id }, include: { quiz: { select: { title: true, description: true, timePerQuestion: true } } } });
  if (!room) throw new AppError(404, 'Room not found');
  const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${room.code}`;
  const qrSvg = await QRCode.toString(joinUrl, { type: 'svg', width: 300, margin: 1 });
  const cardHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Join ${room.quiz.title}</title><style>@page{size:A4;margin:0}body{margin:0;padding:20mm;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.card{max-width:400px;margin:0 auto;border:2px solid #e5e7eb;border-radius:16px;padding:24px;text-align:center}.logo{font-size:28px;font-weight:800;color:#111827;margin-bottom:8px}.tagline{color:#6b7280;font-size:14px;margin-bottom:24px}.quiz-title{font-size:20px;font-weight:700;color:#111827;margin-bottom:8px}.quiz-meta{color:#6b7280;font-size:13px;margin-bottom:20px}.qr{margin:20px 0}.code{font-family:'SF Mono',Monaco,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0}.instructions{text-align:left;font-size:13px;color:#4b5563;line-height:1.8}.instructions li{margin:8px 0}.footer{margin-top:24px;font-size:11px;color:#9ca3af}</style></head><body><div class="card"><div class="logo">AptiQuiz</div><div class="tagline">Real-time Multiplayer Aptitude Quiz</div><div class="quiz-title">${room.quiz.title}</div><div class="quiz-meta">${room.quiz.description || 'Aptitude Quiz'} \u2022 ${room.quiz.timePerQuestion || 60}s per question</div><div class="qr">${qrSvg}</div><div class="code">${room.code}</div><ul class="instructions"><li>Scan QR code or visit the link below</li><li>Enter join code: <strong>${room.code}</strong></li><li>Enter your name and join the lobby</li><li>Wait for host to start the quiz</li></ul><div class="footer">AptiQuiz \u2022 ${new Date().toLocaleDateString()}</div></div></body></html>`;
  res.setHeader('Content-Type', 'text/html'); res.setHeader('Content-Disposition', `attachment; filename="qr-card-${room.code}.html"`); res.send(cardHtml);
}));

export { router as roomRouter };