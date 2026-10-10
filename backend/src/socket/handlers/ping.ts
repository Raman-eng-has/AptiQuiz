import { Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { SocketEvents } from '../constants.js';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handlePing(
  socket: AuthenticatedSocket,
  clientTime: number,
  callback: (serverTime: number) => void
) {
  const serverTime = Date.now();
  const rtt = serverTime - clientTime;
  const latency = Math.floor(rtt / 2);

  if (socket.data.playerId) {
    await prisma.roomPlayer.update({
      where: { id: socket.data.playerId },
      data: { latencyMs: latency, lastPingAt: new Date() },
    });
  }

  callback(serverTime);
}

export async function handleSyncTime(socket: AuthenticatedSocket) {
  const serverTime = Date.now();
  socket.emit(SocketEvents.SYNC_TIME, serverTime, 0);
}
