import { Server, Socket } from 'socket.io';
import { prisma } from '../index.js';
import { verifyToken } from '../middleware/auth.js';
import { UserRole, RoomStatus, PowerUpType } from '@prisma/client';
import { SocketEvents, Difficulty, SCORE_BASE_POINTS, SPEED_BONUS_MULTIPLIER, STREAK_BONUS_PER_CORRECT, MAX_STREAK_BONUS, LATENCY_CREDIT_MAX_MS, GRACE_WINDOW_MS, LEADERBOARD_UPDATE_INTERVAL } from './constants.js';
import { handleJoinRoom } from './handlers/joinRoom.js';
import { handleSubmitAnswer } from './handlers/submitAnswer.js';
import { handleHostControl } from './handlers/hostControl.js';
import { handlePowerUpUse } from './handlers/powerUp.js';
import { handlePing } from './handlers/ping.js';
import { handleIntegrityEvent } from './handlers/integrity.js';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

const roomTimers = new Map<string, NodeJS.Timeout>();
const leaderboardIntervals = new Map<string, NodeJS.Timeout>();

export function setupSocketHandlers(io: Server) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, collegeId: true, branchId: true },
      });

      if (!user) return next(new Error('User not found'));

      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected: ${socket.data.userId}`);

    socket.on(SocketEvents.JOIN_ROOM, (data, callback) => handleJoinRoom(io, socket, data, callback));
    socket.on(SocketEvents.SUBMIT_ANSWER, (data, callback) => handleSubmitAnswer(io, socket, data, callback));
    socket.on(SocketEvents.HOST_CONTROL, (action) => handleHostControl(io, socket, action));
    socket.on(SocketEvents.POWER_UP_USE, (data, callback) => handlePowerUpUse(io, socket, data, callback));
    socket.on(SocketEvents.PING, (clientTime, callback) => handlePing(socket, clientTime, callback));
    socket.on(SocketEvents.INTEGRITY_EVENT, (event) => handleIntegrityEvent(io, socket, event));
    socket.on(SocketEvents.LEAVE_ROOM, () => handleLeaveRoom(io, socket));

    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.data.userId}`);
      await handleDisconnect(io, socket);
    });
  });

  setInterval(() => {
    for (const [roomId, interval] of leaderboardIntervals.entries()) {
      broadcastLeaderboardUpdate(io, roomId);
    }
  }, LEADERBOARD_UPDATE_INTERVAL);
}

async function handleLeaveRoom(io: Server, socket: AuthenticatedSocket) {
  const { roomId, playerId, userId } = socket.data;
  if (!roomId || !playerId) return;

  await prisma.roomPlayer.update({ where: { id: playerId }, data: { isConnected: false, leftAt: new Date() } });
  socket.leave(roomId);
  socket.data.roomId = '';
  socket.data.playerId = '';
  io.to(roomId).emit(SocketEvents.PLAYER_LEFT, playerId, 'left');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (room && room.hostId === userId) {
    io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'player_left', payload: { playerId } });
  }
}

async function handleDisconnect(io: Server, socket: AuthenticatedSocket) {
  const { roomId, playerId, userId } = socket.data;
  if (!roomId || !playerId) return;

  await prisma.roomPlayer.update({ where: { id: playerId }, data: { isConnected: false, lastPingAt: new Date() } });
  io.to(roomId).emit(SocketEvents.PLAYER_LEFT, playerId, 'disconnected');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (room && room.hostId === userId) {
    io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'player_disconnected', payload: { playerId } });
  }
}

export async function broadcastRoomState(io: Server, roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true } },
      teams: { include: { members: { include: { user: { select: { id: true, name: true } } } } } },
    },
  });

  if (!room) return;

  const currentQuestion = room.currentQuestionIndex >= 0 ? await getCurrentQuestionWithVariants(room.quizId, room.currentQuestionIndex) : null;
  const timeRemaining = room.questionEndTime ? Math.max(0, Math.ceil((room.questionEndTime.getTime() - Date.now()) / 1000)) : 0;

  const state = { room: { ...room, quiz: undefined, players: undefined, teams: undefined }, players: room.players, teams: room.teams, currentQuestion, questionIndex: room.currentQuestionIndex, timeRemaining, status: room.status };
  io.to(roomId).emit(SocketEvents.ROOM_STATE, state);
}

async function getCurrentQuestionWithVariants(quizId: string, index: number) {
  const quizQuestion = await prisma.quizQuestion.findFirst({ where: { quizId, order: index }, include: { question: { include: { variants: true } } } });
  if (!quizQuestion) return null;
  const q = quizQuestion.question;
  const shuffledOptions = [...q.options];
  const shuffledIndices = shuffledOptions.map((_, i) => i);
  for (let i = shuffledIndices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]; [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]]; }
  return { ...q, options: shuffledOptions, shuffledOptions, shuffledOptionIndices: shuffledIndices, variants: q.variants };
}

export async function startQuestionTimer(io: Server, roomId: string, questionIndex: number, timeLimit: number) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return;

  const serverStartTime = Date.now();
  const serverEndTime = serverStartTime + timeLimit * 1000;

  await prisma.room.update({ where: { id: roomId }, data: { currentQuestionIndex: questionIndex, questionStartTime: new Date(serverStartTime), questionEndTime: new Date(serverEndTime), status: RoomStatus.LIVE } });

  const question = await getCurrentQuestionWithVariants(room.quizId, questionIndex);
  if (!question) return;

  const totalQuestions = await prisma.quizQuestion.count({ where: { quizId: room.quizId } });

  io.to(roomId).emit(SocketEvents.QUESTION_START, { question, index: questionIndex, totalQuestions, timeLimit, serverStartTime, serverEndTime });

  const existingTimer = roomTimers.get(roomId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(() => endQuestion(io, roomId, questionIndex), timeLimit * 1000 + 100);
  roomTimers.set(roomId, timer);

  if (room.joinMode === 'OFFLINE_PHYSICAL' && room.qrRotationInterval > 0) startQRRotation(io, roomId);
}

async function endQuestion(io: Server, roomId: string, questionIndex: number) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } } } });
  if (!room) return;

  const quizQuestion = room.quiz.questions[questionIndex];
  if (!quizQuestion) return;

  const answers = await prisma.answer.findMany({ where: { roomId, questionIndex } });
  const correctAnswer = quizQuestion.question.correctAnswer;

  const results = await Promise.all(room.players.map(async (player) => {
    const answer = answers.find(a => a.playerId === player.id);
    const isCorrect = answer?.isCorrect ?? false;
    const pointsEarned = answer?.pointsEarned ?? 0;
    const timeTaken = answer ? (answer.serverReceivedAt.getTime() - (room.questionStartTime?.getTime() || 0)) : 0;
    return { playerId: player.id, playerName: player.user?.name || player.nickname || 'Unknown', isCorrect, pointsEarned, timeTaken, streak: player.streak, powerUpUsed: answer?.powerUpUsed ?? null };
  }));

  await prisma.roundResult.create({ data: { roomId, questionIndex, questionId: quizQuestion.questionId, correctAnswer: JSON.stringify(correctAnswer), explanation: quizQuestion.question.explanation, answerDistribution: {}, accuracy: answers.length > 0 ? answers.filter(a => a.isCorrect).length / answers.length : 0, averageTime: answers.length > 0 ? answers.reduce((s, a) => s + a.rttMs, 0) / answers.length : 0 } });

  io.to(roomId).emit(SocketEvents.QUESTION_END, { questionIndex, correctAnswer, explanation: quizQuestion.question.explanation });
  io.to(roomId).emit(SocketEvents.ROUND_RESULT, { results, leaderboard: await computeLeaderboard(roomId), questionIndex });

  await updatePlayerScores(roomId, results);

  const nextIndex = questionIndex + 1;
  const nextQuestion = room.quiz.questions[nextIndex];
  if (nextQuestion) { const timeLimit = nextQuestion.timeLimit || nextQuestion.question.timeLimit; setTimeout(() => startQuestionTimer(io, roomId, nextIndex, timeLimit), 3000); }
  else { await endQuiz(io, roomId); }
}

async function updatePlayerScores(roomId: string, results: any[]) {
  for (const result of results) {
    await prisma.roomPlayer.update({ where: { id: result.playerId }, data: { score: { increment: result.pointsEarned }, correctCount: { increment: result.isCorrect ? 1 : 0 }, streak: result.isCorrect ? { increment: 1 } : 0, totalTime: { increment: result.timeTaken } } });
  }
}

async function computeLeaderboard(roomId: string) {
  const players = await prisma.roomPlayer.findMany({ where: { roomId, leftAt: null }, include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true }, orderBy: { score: 'desc' } });
  return players.map((p, i) => ({ playerId: p.id, playerName: p.user?.name || p.nickname || 'Unknown', avatarUrl: p.user?.avatarUrl, score: p.score, rank: i + 1, correctCount: p.correctCount, streak: p.streak, isCurrentUser: false, teamId: p.teamId, teamName: p.team?.name }));
}

async function endQuiz(io: Server, roomId: string) {
  await prisma.room.update({ where: { id: roomId }, data: { status: RoomStatus.ENDED, endedAt: new Date() } });
  const leaderboard = await computeLeaderboard(roomId);
  io.to(roomId).emit(SocketEvents.LEADERBOARD_UPDATE, leaderboard);
  const timer = roomTimers.get(roomId); if (timer) clearTimeout(timer); roomTimers.delete(roomId);
  const interval = leaderboardIntervals.get(roomId); if (interval) clearInterval(interval); leaderboardIntervals.delete(roomId);
}

async function broadcastLeaderboardUpdate(io: Server, roomId: string) {
  const leaderboard = await computeLeaderboard(roomId);
  io.to(roomId).emit(SocketEvents.LEADERBOARD_UPDATE, leaderboard);
}

function startQRRotation(io: Server, roomId: string) {
  const rotateQR = async () => {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== RoomStatus.LIVE) return;
    const { v4: uuidv4 } = await import('uuid');
    const newCode = uuidv4();
    const expiresAt = Date.now() + (room.qrRotationInterval || 30) * 1000;
    await prisma.room.update({ where: { id: roomId }, data: { currentQrCode: newCode, qrCodeExpiresAt: new Date(expiresAt) } });
    io.to(roomId).emit(SocketEvents.QR_CODE_ROTATION, { code: newCode, expiresAt });
  };
  setInterval(rotateQR, (await prisma.room.findUnique({ where: { id: roomId } }))?.qrRotationInterval * 1000 || 30000);
}

export { endQuestion, broadcastLeaderboardUpdate, startQuestionTimer, roomTimers, leaderboardIntervals };