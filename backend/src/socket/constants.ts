export const SocketEvents = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_RECONNECTED: 'player_reconnected',
  ROOM_STATE: 'room_state',
  QUESTION_START: 'question_start',
  QUESTION_END: 'question_end',
  SUBMIT_ANSWER: 'submit_answer',
  ANSWER_RECEIVED: 'answer_received',
  ROUND_RESULT: 'round_result',
  LEADERBOARD_UPDATE: 'leaderboard_update',
  PERSONAL_RANK_UPDATE: 'personal_rank_update',
  HOST_CONTROL: 'host_control',
  HOST_KICK: 'host_kick',
  HOST_MUTE: 'host_mute',
  HOST_LOCK: 'host_lock',
  HOST_EXTEND_TIME: 'host_extend_time',
  HOST_SKIP_QUESTION: 'host_skip_question',
  HOST_END_EARLY: 'host_end_early',
  HOST_EDIT_QUESTION: 'host_edit_question',
  HOST_INSERT_QUESTION: 'host_insert_question',
  POWER_UP_USE: 'power_up_use',
  POWER_UP_RESULT: 'power_up_result',
  PING: 'ping',
  PONG: 'pong',
  SYNC_TIME: 'sync_time',
  ERROR: 'error',
  INTEGRITY_EVENT: 'integrity_event',
  QR_CODE_ROTATION: 'qr_code_rotation',
} as const;

export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

export const PowerUpType = {
  DOUBLE_POINTS: 'DOUBLE_POINTS',
  FIFTY_FIFTY: 'FIFTY_FIFTY',
  TIME_FREEZE: 'TIME_FREEZE',
} as const;

export const RoomStatus = {
  WAITING: 'WAITING',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
} as const;

export const RoomJoinMode = {
  ONLINE_LIVE: 'ONLINE_LIVE',
  OFFLINE_PHYSICAL: 'OFFLINE_PHYSICAL',
  SELF_PACED: 'SELF_PACED',
} as const;

export const IntegrityEventType = {
  FOCUS_LOSS: 'FOCUS_LOSS',
  DEVTOOLS_DETECTED: 'DEVTOOLS_DETECTED',
  TOO_FAST_ANSWER: 'TOO_FAST_ANSWER',
  IDENTICAL_PATTERN: 'IDENTICAL_PATTERN',
  IMPOSSIBLE_ACCURACY: 'IMPOSSIBLE_ACCURACY',
  MULTIPLE_DEVICES: 'MULTIPLE_DEVICES',
  EXTENSION_MISSING: 'EXTENSION_MISSING',
  CLIPBOARD_ACCESS: 'CLIPBOARD_ACCESS',
  TAB_SWITCH: 'TAB_SWITCH',
} as const;

export const SCORE_BASE_POINTS = {
  EASY: 100,
  MEDIUM: 150,
  HARD: 200,
} as const;

export const SPEED_BONUS_MULTIPLIER = 0.5;
export const STREAK_BONUS_PER_CORRECT = 0.1;
export const MAX_STREAK_BONUS = 0.5;
export const LATENCY_CREDIT_MAX_MS = 300;
export const GRACE_WINDOW_MS = 500;
export const LEADERBOARD_UPDATE_INTERVAL = 250;

// Type definitions for socket handlers
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type PowerUpType = 'DOUBLE_POINTS' | 'FIFTY_FIFTY' | 'TIME_FREEZE';
export type RoomStatus = 'WAITING' | 'LIVE' | 'PAUSED' | 'ENDED';
export type RoomJoinMode = 'ONLINE_LIVE' | 'OFFLINE_PHYSICAL' | 'SELF_PACED';
export type IntegrityEventType = 'FOCUS_LOSS' | 'DEVTOOLS_DETECTED' | 'TOO_FAST_ANSWER' | 'IDENTICAL_PATTERN' | 'IMPOSSIBLE_ACCURACY' | 'MULTIPLE_DEVICES' | 'EXTENSION_MISSING' | 'CLIPBOARD_ACCESS' | 'TAB_SWITCH';

export interface JoinRoomData {
  code: string;
  nickname?: string;
  userId?: string;
  teamId?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  playerId?: string;
  roomState?: RoomState;
  error?: string;
}

export interface RoomState {
  room: any;
  players: any[];
  teams: any[];
  currentQuestion: any;
  questionIndex: number;
  timeRemaining: number;
  status: RoomStatus;
}

export interface HostControlAction {
  type: 'pause' | 'resume' | 'skip' | 'extend' | 'end' | 'edit_question' | 'insert_question' | 'lock' | 'unlock' | 'kick' | 'mute';
  payload?: any;
}

export interface PowerUpUseData {
  questionIndex: number;
  type: PowerUpType;
}

export interface PowerUpUseResponse {
  success: boolean;
  error?: string;
}

export interface PowerUpResult {
  playerId: string;
  type: PowerUpType;
  success: boolean;
  effect: any;
}

export interface SubmitAnswerData {
  questionIndex: number;
  answer: string | string[] | number;
  clientSentAt: number;
  sequenceId: number;
  powerUpUsed?: PowerUpType;
}

export interface SubmitAnswerResponse {
  success: boolean;
  accepted: boolean;
  error?: string;
}