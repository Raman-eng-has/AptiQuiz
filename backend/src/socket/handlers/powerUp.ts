import { Server, Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { SocketEvents, PowerUpType, PowerUpUseData, PowerUpUseResponse, PowerUpResult } from '../constants.js';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handlePowerUpUse(
  io: Server,
  socket: AuthenticatedSocket,
  data: PowerUpUseData,
  callback: (response: PowerUpUseResponse) => void
) {
  try {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return callback({ success: false, error: 'Not in a room' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { quiz: true, players: { where: { id: playerId } } },
    });
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (!room.quiz.enablePowerUps) return callback({ success: false, error: 'Power-ups disabled' });
    if (room.status !== 'LIVE') return callback({ success: false, error: 'Quiz not live' });

    const player = room.players[0];
    if (!player) return callback({ success: false, error: 'Player not found' });

    if (!player.powerUpsAvailable.includes(data.type)) {
      return callback({ success: false, error: 'Power-up not available' });
    }

    if (data.type === PowerUpType.TIME_FREEZE && data.questionIndex === (room.quiz?.questions?.length ?? 0) - 1) {
      return callback({ success: false, error: 'Cannot use Time Freeze on last question' });
    }

    await prisma.roomPlayer.update({
      where: { id: playerId },
      data: { powerUpsUsed: { push: data.type }, powerUpsAvailable: { set: player.powerUpsAvailable.filter((p: string) => p !== data.type) } },
    });

    await prisma.powerUpUse.create({
      data: { roomId, playerId, questionIndex: data.questionIndex, type: data.type, wasSuccessful: true },
    });

    let effect: any = {};
    if (data.type === PowerUpType.FIFTY_FIFTY) {
      const question = room.quiz?.questions?.[data.questionIndex]?.question;
      if (question && question.options.length > 2) {
        const correctIndex = question.options.findIndex((opt: string) => opt === JSON.parse(question.correctAnswer));
        const wrongIndices = question.options.map((_: string, i: number) => i).filter(i => i !== correctIndex);
        const removeCount = Math.min(2, wrongIndices.length);
        const toRemove = wrongIndices.sort(() => Math.random() - 0.5).slice(0, removeCount);
        effect = { removedOptions: toRemove };
      }
    } else if (data.type === PowerUpType.TIME_FREEZE) {
      effect = { extraTime: 5000 };
    } else if (data.type === PowerUpType.DOUBLE_POINTS) {
      effect = { multiplier: 2 };
    }

    const result: PowerUpResult = {
      playerId,
      type: data.type,
      success: true,
      effect,
    };

    io.to(roomId).emit(SocketEvents.POWER_UP_RESULT, result);
    callback({ success: true });
  } catch (error) {
    console.error('Power-up error:', error);
    callback({ success: false, error: 'Failed to use power-up' });
  }
}
