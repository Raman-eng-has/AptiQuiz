import { Server, Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { SocketEvents, RoomStatus, RoomJoinMode, UserRole, JoinRoomData, JoinRoomResponse, RoomState } from '../constants.js';
import { broadcastRoomState, startQuestionTimer } from '../index.js';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handleJoinRoom(
  io: Server,
  socket: AuthenticatedSocket,
  data: JoinRoomData,
  callback: (response: JoinRoomResponse) => void
) {
  try {
    const room = await prisma.room.findUnique({
      where: { code: data.code.toUpperCase() },
      include: {
        quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
        players: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true } },
        teams: { include: { members: { include: { user: { select: { id: true, name: true } } } } } },
      },
    });

    if (!room) {
      return callback({ success: false, error: 'Invalid room code' });
    }

    if (room.status === RoomStatus.ENDED) {
      return callback({ success: false, error: 'Quiz has ended' });
    }

    if (!room.allowLateJoin && room.status === RoomStatus.LIVE) {
      return callback({ success: false, error: 'Late join not allowed' });
    }

    if (room.players.length >= room.maxPlayers) {
      return callback({ success: false, error: 'Room is full' });
    }

    if (room.requireLogin && !data.userId) {
      return callback({ success: false, error: 'Login required to join this room' });
    }

    let player = await prisma.roomPlayer.findFirst({
      where: { roomId: room.id, userId: socket.data.userId },
    });

    if (player) {
      await prisma.roomPlayer.update({
        where: { id: player.id },
        data: { isConnected: true, leftAt: null, lastPingAt: new Date() },
      });
    } else {
      const seatNumber = room.players.length + 1;
      player = await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: socket.data.userId,
          nickname: data.nickname,
          teamId: data.teamId,
          seatNumber,
          powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'],
        },
      });
    }

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = player.id;

    await prisma.auditLog.create({
      data: { userId: socket.data.userId, action: 'JOIN_ROOM', entityType: 'RoomPlayer', entityId: player.id, roomId: room.id },
    });

    const roomState = await buildRoomState(room, player.id);
    io.to(room.id).emit(SocketEvents.PLAYER_JOINED, {
      ...player,
      user: player.userId ? { id: socket.data.userId, name: socket.data.userId, avatarUrl: undefined } : undefined,
    });

    if (room.status === RoomStatus.WAITING && room.hostId === socket.data.userId) {
    }

    callback({ success: true, playerId: player.id, roomState });
  } catch (error) {
    console.error('Join room error:', error);
    callback({ success: false, error: 'Failed to join room' });
  }
}

async function buildRoomState(room: any, currentPlayerId: string): Promise<RoomState> {
  const currentQuestion = room.currentQuestionIndex >= 0
    ? room.quiz.questions[room.currentQuestionIndex]
    : null;

  const timeRemaining = room.questionEndTime
    ? Math.max(0, Math.ceil((room.questionEndTime.getTime() - Date.now()) / 1000))
    : 0;

  return {
    room: { ...room, quiz: undefined, players: undefined, teams: undefined },
    players: room.players,
    teams: room.teams,
    currentQuestion: currentQuestion ? { ...currentQuestion.question } : null,
    questionIndex: room.currentQuestionIndex,
    timeRemaining,
    status: room.status,
  };
}
