import { Server, Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { SocketEvents, IntegrityEventType } from '../constants.js';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handleIntegrityEvent(
  io: Server,
  socket: AuthenticatedSocket,
  event: { type: IntegrityEventType; details: Record<string, unknown> }
) {
  try {
    const { roomId, playerId, userId } = socket.data;
    if (!roomId || !playerId) return;

    const severityMap: Record<IntegrityEventType, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      [IntegrityEventType.FOCUS_LOSS]: 'LOW',
      [IntegrityEventType.DEVTOOLS_DETECTED]: 'MEDIUM',
      [IntegrityEventType.TOO_FAST_ANSWER]: 'HIGH',
      [IntegrityEventType.IDENTICAL_PATTERN]: 'HIGH',
      [IntegrityEventType.IMPOSSIBLE_ACCURACY]: 'HIGH',
      [IntegrityEventType.MULTIPLE_DEVICES]: 'MEDIUM',
      [IntegrityEventType.EXTENSION_MISSING]: 'MEDIUM',
      [IntegrityEventType.CLIPBOARD_ACCESS]: 'LOW',
      [IntegrityEventType.TAB_SWITCH]: 'LOW',
    };

    const integrityEvent = await prisma.integrityEvent.create({
      data: {
        id: uuidv4(),
        roomId,
        playerId,
        type: event.type,
        severity: severityMap[event.type] || 'LOW',
        details: event.details as any,
        timestamp: new Date(),
      },
    });

    await updateIntegrityScore(playerId);

    io.to(roomId).emit(SocketEvents.INTEGRITY_EVENT, integrityEvent);
  } catch (error) {
    console.error('Integrity event error:', error);
  }
}

async function updateIntegrityScore(playerId: string) {
  const events = await prisma.integrityEvent.findMany({
    where: { playerId },
    orderBy: { timestamp: 'desc' },
  });

  let score = 100;
  const weights: Record<string, number> = {
    LOW: -1,
    MEDIUM: -5,
    HIGH: -15,
  };

  for (const event of events) {
    score += weights[event.severity] || 0;
  }

  score = Math.max(0, Math.min(100, score));

  await prisma.roomPlayer.update({
    where: { id: playerId },
    data: { user: { update: { integrityScore: score } } },
  }).catch(() => {});
}

export async function detectTooFastAnswer(roomId: string, playerId: string, questionId: string, timeTakenMs: number) {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  const minReadTime = Math.max(1000, question.text.length * 20);
  if (timeTakenMs < minReadTime) {
    await prisma.integrityEvent.create({
      data: {
        id: uuidv4(),
        roomId,
        playerId,
        type: IntegrityEventType.TOO_FAST_ANSWER,
        severity: 'HIGH',
        details: { timeTakenMs, minReadTime, questionLength: question.text.length },
        timestamp: new Date(),
      },
    });
  }
}

export async function detectIdenticalPatterns(roomId: string, playerId: string, questionIndex: number, answer: any, timeTakenMs: number) {
  const otherAnswers = await prisma.answer.findMany({
    where: { roomId, questionIndex, NOT: { playerId } },
    select: { answer: true, rttMs: true, playerId: true },
  });

  for (const other of otherAnswers) {
    const otherAnswer = JSON.parse(other.answer);
    const timeDiff = Math.abs(timeTakenMs - other.rttMs);
    if (JSON.stringify(answer) === JSON.stringify(otherAnswer) && timeDiff < 100) {
      await prisma.integrityEvent.create({
        data: {
          id: uuidv4(),
          roomId,
          playerId,
          type: IntegrityEventType.IDENTICAL_PATTERN,
          severity: 'HIGH',
          details: { otherPlayerId: other.playerId, timeDiff, answer },
          timestamp: new Date(),
        },
      });
    }
  }
}

export async function detectImpossibleAccuracy(playerId: string, roomId: string) {
  const answers = await prisma.answer.findMany({ where: { playerId, roomId } });
  if (answers.length < 5) return;

  const recentCorrect = answers.slice(-5).filter(a => a.isCorrect).length;
  if (recentCorrect === 5) {
    const allAnswers = await prisma.answer.findMany({ where: { roomId } });
    const avgAccuracy = allAnswers.filter(a => a.isCorrect).length / allAnswers.length;
    if (avgAccuracy < 0.5) {
      await prisma.integrityEvent.create({
        data: {
          id: uuidv4(),
          roomId,
          playerId,
          type: IntegrityEventType.IMPOSSIBLE_ACCURACY,
          severity: 'HIGH',
          details: { streak: 5, roomAvgAccuracy: avgAccuracy },
          timestamp: new Date(),
        },
      });
    }
  }
}

export async function detectMultipleDevices(roomId: string, userId: string) {
  const existingPlayers = await prisma.roomPlayer.findMany({
    where: { roomId, userId, isConnected: true },
  });
  if (existingPlayers.length > 1) {
    for (const player of existingPlayers.slice(1)) {
      await prisma.integrityEvent.create({
        data: {
          id: uuidv4(),
          roomId,
          playerId: player.id,
          type: IntegrityEventType.MULTIPLE_DEVICES,
          severity: 'MEDIUM',
          details: { otherPlayerIds: existingPlayers.filter(p => p.id !== player.id).map(p => p.id) },
          timestamp: new Date(),
        },
      });
    }
  }
}
