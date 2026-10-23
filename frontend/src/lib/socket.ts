import { io, Socket } from 'socket.io-client';
import { getAuthHeader } from './auth';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomState,
  QuestionStartData,
  RoundResultData,
  LeaderboardEntry,
  PersonalRank,
  PowerUpResult,
  IntegrityEvent,
  JoinRoomData,
  JoinRoomResponse,
  SubmitAnswerData,
  SubmitAnswerResponse,
  PowerUpUseData,
  PowerUpUseResponse,
  HostControlAction,
} from '@aptiquiz/shared';
import { SocketEvents } from '@aptiquiz/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket | null {
  return socket;
}

export function initSocket(): TypedSocket {
  if (socket?.connected) return socket;

  const token = getAuthHeader()?.replace('Bearer ', '');
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(data: JoinRoomData): Promise<JoinRoomResponse> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));
    socket.emit(SocketEvents.JOIN_ROOM, data, (response) => {
      if (response.success) resolve(response);
      else reject(new Error(response.error || 'Failed to join room'));
    });
  });
}

export function leaveRoom() {
  socket?.emit(SocketEvents.LEAVE_ROOM);
}

export function submitAnswer(data: SubmitAnswerData): Promise<SubmitAnswerResponse> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));
    socket.emit(SocketEvents.SUBMIT_ANSWER, data, (response) => {
      if (response.success) resolve(response);
      else reject(new Error(response.error || 'Failed to submit answer'));
    });
  });
}

export function hostControl(action: HostControlAction) {
  socket?.emit(SocketEvents.HOST_CONTROL, action);
}

export function usePowerUp(data: PowerUpUseData): Promise<PowerUpUseResponse> {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));
    socket.emit(SocketEvents.POWER_UP_USE, data, (response) => {
      if (response.success) resolve(response);
      else reject(new Error(response.error || 'Failed to use power-up'));
    });
  });
}

export function sendIntegrityEvent(event: Omit<IntegrityEvent, 'id' | 'timestamp' | 'reviewed'>) {
  socket?.emit(SocketEvents.INTEGRITY_EVENT, event);
}

export function ping(): Promise<number> {
  return new Promise((resolve) => {
    if (!socket) return resolve(0);
    socket.emit(SocketEvents.PING, Date.now(), (serverTime) => {
      resolve(Date.now() - serverTime);
    });
  });
}

export const socketEvents = {
  onPlayerJoined: (callback: (player: any) => void) => socket?.on(SocketEvents.PLAYER_JOINED, callback),
  onPlayerLeft: (callback: (playerId: string, reason?: string) => void) => socket?.on(SocketEvents.PLAYER_LEFT, callback),
  onPlayerReconnected: (callback: (playerId: string) => void) => socket?.on(SocketEvents.PLAYER_RECONNECTED, callback),
  onRoomState: (callback: (state: RoomState) => void) => socket?.on(SocketEvents.ROOM_STATE, callback),
  onQuestionStart: (callback: (data: QuestionStartData) => void) => socket?.on(SocketEvents.QUESTION_START, callback),
  onQuestionEnd: (callback: (data: any) => void) => socket?.on(SocketEvents.QUESTION_END, callback),
  onAnswerReceived: (callback: (data: any) => void) => socket?.on(SocketEvents.ANSWER_RECEIVED, callback),
  onRoundResult: (callback: (data: RoundResultData) => void) => socket?.on(SocketEvents.ROUND_RESULT, callback),
  onLeaderboardUpdate: (callback: (leaderboard: LeaderboardEntry[]) => void) => socket?.on(SocketEvents.LEADERBOARD_UPDATE, callback),
  onPersonalRankUpdate: (callback: (rank: PersonalRank) => void) => socket?.on(SocketEvents.PERSONAL_RANK_UPDATE, callback),
  onHostControl: (callback: (action: HostControlAction) => void) => socket?.on(SocketEvents.HOST_CONTROL, callback),
  onPowerUpResult: (callback: (result: PowerUpResult) => void) => socket?.on(SocketEvents.POWER_UP_RESULT, callback),
  onSyncTime: (callback: (serverTime: number, offset: number) => void) => socket?.on(SocketEvents.SYNC_TIME, callback),
  onError: (callback: (error: { code: string; message: string }) => void) => socket?.on(SocketEvents.ERROR, callback),
  onIntegrityEvent: (callback: (event: IntegrityEvent) => void) => socket?.on(SocketEvents.INTEGRITY_EVENT, callback),
  onQrCodeRotation: (callback: (data: { code: string; expiresAt: number }) => void) => socket?.on(SocketEvents.QR_CODE_ROTATION, callback),
  offAll: () => { socket?.offAny(); },
};