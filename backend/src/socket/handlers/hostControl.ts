import { Server, Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { SocketEvents, RoomStatus, HostControlAction, UserRole } from '../constants.js';
import { startQuestionTimer, endQuestion, broadcastRoomState, roomTimers, leaderboardIntervals } from '../index.js';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handleHostControl(
  io: Server,
  socket: AuthenticatedSocket,
  action: HostControlAction
) {
  try {
    const { roomId, userId, role } = socket.data;
    if (!roomId) return;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return;
    if (room.hostId !== userId && role !== UserRole.SUPER_ADMIN) return;

    switch (action.type) {
      case 'pause': {
        if (room.status !== RoomStatus.LIVE) break;
        await prisma.room.update({ where: { id: roomId }, data: { status: RoomStatus.PAUSED } });
        const timer = roomTimers.get(roomId);
        if (timer) clearTimeout(timer);
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'pause' });
        break;
      }
      case 'resume': {
        if (room.status !== RoomStatus.PAUSED) break;
        await prisma.room.update({ where: { id: roomId }, data: { status: RoomStatus.LIVE } });
        const question = room.quiz?.questions?.[room.currentQuestionIndex];
        if (question) {
          const timeLimit = question.timeLimit || question.question?.timeLimit;
          const remaining = room.questionEndTime ? Math.max(0, Math.ceil((room.questionEndTime.getTime() - Date.now()) / 1000)) : timeLimit;
          await startQuestionTimer(io, roomId, room.currentQuestionIndex, remaining);
        }
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'resume' });
        break;
      }
      case 'skip': {
        const timer = roomTimers.get(roomId);
        if (timer) clearTimeout(timer);
        await endQuestion(io, roomId, room.currentQuestionIndex);
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'skip' });
        break;
      }
      case 'extend': {
        const { additionalSeconds = 30 } = action.payload as { additionalSeconds?: number };
        const newEndTime = Date.now() + additionalSeconds * 1000;
        await prisma.room.update({ where: { id: roomId }, data: { questionEndTime: new Date(newEndTime) } });
        const timer = roomTimers.get(roomId);
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => endQuestion(io, roomId, room.currentQuestionIndex), additionalSeconds * 1000);
        roomTimers.set(roomId, newTimer);
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'extend', payload: { additionalSeconds } });
        break;
      }
      case 'end': {
        await endQuiz(io, roomId);
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'end' });
        break;
      }
      case 'lock': {
        await prisma.room.update({ where: { id: roomId }, data: { allowLateJoin: false } });
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'lock' });
        break;
      }
      case 'unlock': {
        await prisma.room.update({ where: { id: roomId }, data: { allowLateJoin: true } });
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'unlock' });
        break;
      }
      case 'kick': {
        const { targetPlayerId } = action.payload as { targetPlayerId: string };
        await prisma.roomPlayer.update({ where: { id: targetPlayerId }, data: { isConnected: false, leftAt: new Date() } });
        io.to(targetPlayerId).emit(SocketEvents.ERROR, { code: 'KICKED', message: 'You have been kicked by the host' });
        io.to(roomId).emit(SocketEvents.PLAYER_LEFT, targetPlayerId, 'kicked');
        break;
      }
      case 'mute': {
        const { targetPlayerId } = action.payload as { targetPlayerId: string };
        io.to(targetPlayerId).emit(SocketEvents.ERROR, { code: 'MUTED', message: 'You have been muted by the host' });
        io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'mute', payload: { targetPlayerId } });
        break;
      }
      case 'edit_question': {
        const { questionIndex, newQuestionId } = action.payload as { questionIndex: number; newQuestionId: string };
        if (questionIndex > room.currentQuestionIndex) {
          await prisma.quizQuestion.update({
            where: { quizId_questionId: { quizId: room.quizId, questionId: newQuestionId } },
            data: { order: questionIndex },
          });
          await prisma.auditLog.create({
            data: { userId, action: 'EDIT_QUESTION', entityType: 'QuizQuestion', entityId: newQuestionId, roomId, newValue: { questionIndex, newQuestionId } },
          });
          io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'edit_question', payload: { questionIndex, newQuestionId } });
        }
        break;
      }
      case 'insert_question': {
        const { questionIndex, newQuestionId } = action.payload as { questionIndex: number; newQuestionId: string };
        if (questionIndex > room.currentQuestionIndex) {
          await prisma.quizQuestion.create({
            data: { quizId: room.quizId, questionId: newQuestionId, order: questionIndex },
          });
          await prisma.auditLog.create({
            data: { userId, action: 'INSERT_QUESTION', entityType: 'QuizQuestion', entityId: newQuestionId, roomId, newValue: { questionIndex, newQuestionId } },
          });
          io.to(roomId).emit(SocketEvents.HOST_CONTROL, { type: 'insert_question', payload: { questionIndex, newQuestionId } });
        }
        break;
      }
    }

    await broadcastRoomState(io, roomId);
  } catch (error) {
    console.error('Host control error:', error);
  }
}

async function endQuiz(io: Server, roomId: string) {
  await prisma.room.update({ where: { id: roomId }, data: { status: RoomStatus.ENDED, endedAt: new Date() } });
  const timer = roomTimers.get(roomId);
  if (timer) clearTimeout(timer);
  roomTimers.delete(roomId);
  const interval = leaderboardIntervals.get(roomId);
  if (interval) clearInterval(interval);
  leaderboardIntervals.delete(roomId);
}
