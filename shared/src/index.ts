import { z } from 'zod';

export enum UserRole {
  STUDENT = 'STUDENT',
  HOST = 'HOST',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_SELECT = 'MULTI_SELECT',
  NUMERIC = 'NUMERIC',
  SHORT_TEXT = 'SHORT_TEXT',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuizVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
  COLLEGE_ONLY = 'COLLEGE_ONLY',
}

export enum RoomJoinMode {
  ONLINE_LIVE = 'ONLINE_LIVE',
  OFFLINE_PHYSICAL = 'OFFLINE_PHYSICAL',
  SELF_PACED = 'SELF_PACED',
}

export enum RoomStatus {
  WAITING = 'WAITING',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum PowerUpType {
  DOUBLE_POINTS = 'DOUBLE_POINTS',
  FIFTY_FIFTY = 'FIFTY_FIFTY',
  TIME_FREEZE = 'TIME_FREEZE',
}

export enum BadgeType {
  FIRST_WIN = 'FIRST_WIN',
  PODIUM = 'PODIUM',
  SPEED_DEMON = 'SPEED_DEMON',
  PERFECT_ROUND = 'PERFECT_ROUND',
  STREAK_7 = 'STREAK_7',
  STREAK_30 = 'STREAK_30',
  TOPIC_MASTER = 'TOPIC_MASTER',
  COMEBACK_KID = 'COMEBACK_KID',
  GIANT_SLAYER = 'GIANT_SLAYER',
  FAIR_PLAYER = 'FAIR_PLAYER',
  TEAM_CHAMPION = 'TEAM_CHAMPION',
  LEAGUE_TOP_10 = 'LEAGUE_TOP_10',
}

export enum IntegrityEventType {
  FOCUS_LOSS = 'FOCUS_LOSS',
  DEVTOOLS_DETECTED = 'DEVTOOLS_DETECTED',
  TOO_FAST_ANSWER = 'TOO_FAST_ANSWER',
  IDENTICAL_PATTERN = 'IDENTICAL_PATTERN',
  IMPOSSIBLE_ACCURACY = 'IMPOSSIBLE_ACCURACY',
  MULTIPLE_DEVICES = 'MULTIPLE_DEVICES',
  EXTENSION_MISSING = 'EXTENSION_MISSING',
  CLIPBOARD_ACCESS = 'CLIPBOARD_ACCESS',
  TAB_SWITCH = 'TAB_SWITCH',
}

export enum LeagueScope {
  ROOM = 'ROOM',
  COLLEGE = 'COLLEGE',
  BRANCH = 'BRANCH',
  SEMESTER = 'SEMESTER',
  YEAR = 'YEAR',
  GLOBAL = 'GLOBAL',
  OVERALL = 'OVERALL',
  TOPIC = 'TOPIC',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SEASON = 'SEASON',
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  role: z.nativeEnum(UserRole),
  collegeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  year: z.number().int().min(1).max(4).optional(),
  rating: z.number().default(1200),
  integrityScore: z.number().min(0).max(100).default(100),
  streak: z.number().int().default(0),
  longestStreak: z.number().int().default(0),
  lastActiveDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CollegeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(2).max(20).toUpperCase(),
  domain: z.string().optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BranchSchema = z.object({
  id: z.string().uuid(),
  collegeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SectionSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  semester: z.number().int().min(1).max(8),
  year: z.number().int().min(1).max(4),
  name: z.string().min(1).max(50),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number()]),
  explanation: z.string().optional(),
  topic: z.string().min(1).max(100),
  subtopic: z.string().min(1).max(100).optional(),
  difficulty: z.nativeEnum(Difficulty),
  timeLimit: z.number().int().min(5).max(300),
  points: z.number().int().min(10).max(500),
  imageUrl: z.string().url().optional(),
  tableData: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isParameterized: z.boolean().default(false),
  parameterTemplate: z.string().optional(),
  parameterValues: z.record(z.string(), z.number()).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  numericTolerance: z.number().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const QuestionVariantSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  variantIndex: z.number().int(),
  parameterValues: z.record(z.string(), z.number()),
  renderedText: z.string(),
  renderedOptions: z.array(z.string()),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number()]),
});

export const QuizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  targetCollegeId: z.string().uuid().optional(),
  targetBranchId: z.string().uuid().optional(),
  targetSemester: z.number().int().min(1).max(8).optional(),
  targetYear: z.number().int().min(1).max(4).optional(),
  difficulty: z.nativeEnum(Difficulty),
  visibility: z.nativeEnum(QuizVisibility),
  timePerQuestion: z.number().int().min(5).max(300).optional(),
  totalTimeLimit: z.number().int().min(60).max(7200).optional(),
  negativeMarking: z.number().min(0).max(1).default(0),
  allowLateJoin: z.boolean().default(true),
  maxPlayers: z.number().int().min(2).max(500).default(50),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(true),
  enablePowerUps: z.boolean().default(true),
  adaptiveDifficulty: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  questionId: z.string().uuid(),
  order: z.number().int(),
  timeLimit: z.number().int().optional(),
  points: z.number().int().optional(),
});

export const RoomSchema = z.object({
  id: z.string().uuid(),
  code: z.string().length(6).regex(/^[A-HJ-NP-Z2-9]{6}$/),
  quizId: z.string().uuid(),
  hostId: z.string().uuid(),
  collegeId: z.string().uuid().optional(),
  joinMode: z.nativeEnum(RoomJoinMode),
  status: z.nativeEnum(RoomStatus),
  currentQuestionIndex: z.number().int().default(-1),
  questionStartTime: z.date().optional(),
  questionEndTime: z.date().optional(),
  maxPlayers: z.number().int().min(2).max(500).default(50),
  allowLateJoin: z.boolean().default(true),
  requireLogin: z.boolean().default(false),
  physicalVenue: z.string().optional(),
  geofenceCenter: z.object({ lat: z.number(), lng: z.number() }).optional(),
  geofenceRadius: z.number().optional(),
  ipAllowlist: z.array(z.string()).default([]),
  qrRotationInterval: z.number().int().default(30),
  currentQrCode: z.string().optional(),
  qrCodeExpiresAt: z.date().optional(),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
});

export const RoomPlayerSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  nickname: z.string().min(1).max(50).optional(),
  teamId: z.string().uuid().optional(),
  seatNumber: z.number().int().optional(),
  score: z.number().default(0),
  streak: z.number().int().default(0),
  correctCount: z.number().int().default(0),
  totalTime: z.number().default(0),
  powerUpsUsed: z.array(z.nativeEnum(PowerUpType)).default([]),
  powerUpsAvailable: z.array(z.nativeEnum(PowerUpType)).default([
    PowerUpType.DOUBLE_POINTS,
    PowerUpType.FIFTY_FIFTY,
    PowerUpType.TIME_FREEZE,
  ]),
  isConnected: z.boolean().default(true),
  lastPingAt: z.date().optional(),
  latencyMs: z.number().int().default(0),
  joinedAt: z.date(),
  leftAt: z.date().optional(),
});

export const TeamSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  createdAt: z.date(),
});

export const AnswerSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  playerId: z.string().uuid(),
  questionId: z.string().uuid(),
  questionIndex: z.number().int(),
  answer: z.union([z.string(), z.array(z.string()), z.number()]),
  shuffledOptionIndices: z.array(z.number().int()).optional(),
  submittedAt: z.date(),
  serverReceivedAt: z.date(),
  rttMs: z.number().int(),
  isCorrect: z.boolean(),
  pointsEarned: z.number().default(0),
  powerUpUsed: z.nativeEnum(PowerUpType).optional(),
  sequenceId: z.number().int(),
});

export const RoundResultSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  questionIndex: z.number().int(),
  questionId: z.string().uuid(),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number()]),
  explanation: z.string().optional(),
  answerDistribution: z.record(z.string(), z.number()),
  accuracy: z.number().min(0).max(1),
  averageTime: z.number(),
  createdAt: z.date(),
});

export const LeagueSeasonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  collegeId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  quizIds: z.array(z.string().uuid()),
  pointsScheme: z.object({
    win: z.number().default(100),
    participation: z.number().default(10),
    accuracyBonus: z.number().default(50),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LeagueScoreSchema = z.object({
  id: z.string().uuid(),
  seasonId: z.string().uuid(),
  userId: z.string().uuid(),
  collegeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  totalScore: z.number().default(0),
  quizzesPlayed: z.number().int().default(0),
  totalCorrect: z.number().int().default(0),
  averageAccuracy: z.number().min(0).max(1).default(0),
  averageTime: z.number().default(0),
  rank: z.number().int().optional(),
  updatedAt: z.date(),
});

export const BadgeSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(BadgeType),
  name: z.string().min(1).max(100),
  description: z.string(),
  icon: z.string(),
  rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  criteria: z.string(),
  createdAt: z.date(),
});

export const UserBadgeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  earnedAt: z.date(),
  context: z.string().optional(),
});

export const IntegrityEventSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  playerId: z.string().uuid(),
  type: z.nativeEnum(IntegrityEventType),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  details: z.record(z.unknown()),
  timestamp: z.date(),
  reviewed: z.boolean().default(false),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.date().optional(),
  action: z.enum(['NONE', 'WARNING', 'SCORE_DEDUCTION', 'EXCLUDE_FROM_LEAGUE']).default('NONE'),
});

export const PowerUpUseSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  playerId: z.string().uuid(),
  questionIndex: z.number().int(),
  type: z.nativeEnum(PowerUpType),
  usedAt: z.date(),
  wasSuccessful: z.boolean(),
});

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  oldValue: z.record(z.unknown()).optional(),
  newValue: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

export const DailyChallengeSchema = z.object({
  id: z.string().uuid(),
  date: z.date(),
  quizId: z.string().uuid(),
  streakFreezeUsed: z.number().int().default(0),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type College = z.infer<typeof CollegeSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionVariant = z.infer<typeof QuestionVariantSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type RoomPlayer = z.infer<typeof RoomPlayerSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type RoundResult = z.infer<typeof RoundResultSchema>;
export type LeagueSeason = z.infer<typeof LeagueSeasonSchema>;
export type LeagueScore = z.infer<typeof LeagueScoreSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type UserBadge = z.infer<typeof UserBadgeSchema>;
export type IntegrityEvent = z.infer<typeof IntegrityEventSchema>;
export type PowerUpUse = z.infer<typeof PowerUpUseSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type DailyChallenge = z.infer<typeof DailyChallengeSchema>;

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

export type SocketEvent = typeof SocketEvents[keyof typeof SocketEvents];

export interface ServerToClientEvents {
  player_joined: (player: RoomPlayer & { user?: Pick<User, 'id' | 'name' | 'avatarUrl'> }) => void;
  player_left: (playerId: string, reason?: string) => void;
  player_reconnected: (playerId: string) => void;
  room_state: (state: RoomState) => void;
  question_start: (data: QuestionStartData) => void;
  question_end: (data: QuestionEndData) => void;
  answer_received: (data: AnswerReceivedData) => void;
  round_result: (data: RoundResultData) => void;
  leaderboard_update: (leaderboard: LeaderboardEntry[]) => void;
  personal_rank_update: (rank: PersonalRank) => void;
  host_control: (action: HostControlAction) => void;
  power_up_result: (result: PowerUpResult) => void;
  sync_time: (serverTime: number, offset: number) => void;
  error: (error: { code: string; message: string }) => void;
  integrity_event: (event: IntegrityEvent) => void;
  qr_code_rotation: (data: { code: string; expiresAt: number }) => void;
}

export interface ClientToServerEvents {
  join_room: (data: JoinRoomData, callback: (response: JoinRoomResponse) => void) => void;
  leave_room: () => void;
  submit_answer: (data: SubmitAnswerData, callback: (response: SubmitAnswerResponse) => void) => void;
  host_control: (action: HostControlAction) => void;
  power_up_use: (data: PowerUpUseData, callback: (response: PowerUpUseResponse) => void) => void;
  ping: (clientTime: number, callback: (serverTime: number) => void) => void;
  integrity_event: (event: Omit<IntegrityEvent, 'id' | 'timestamp' | 'reviewed'>) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
  playerId: string;
  role: UserRole;
}

export interface RoomState {
  room: Room;
  players: (RoomPlayer & { user?: Pick<User, 'id' | 'name' | 'avatarUrl'> })[];
  teams: Team[];
  currentQuestion: QuestionWithVariants | null;
  questionIndex: number;
  timeRemaining: number;
  status: RoomStatus;
}

export interface QuestionStartData {
  question: QuestionWithVariants;
  index: number;
  totalQuestions: number;
  timeLimit: number;
  serverStartTime: number;
  serverEndTime: number;
}

export interface QuestionEndData {
  questionIndex: number;
  correctAnswer: string | string[] | number;
  explanation: string | undefined;
}

export interface AnswerReceivedData {
  playerId: string;
  playerName: string;
  hasAnswered: boolean;
}

export interface RoundResultData {
  results: PlayerRoundResult[];
  leaderboard: LeaderboardEntry[];
  questionIndex: number;
}

export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeTaken: number;
  streak: number;
  powerUpUsed: PowerUpType | null;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarUrl: string | undefined;
  score: number;
  rank: number;
  correctCount: number;
  streak: number;
  isCurrentUser: boolean;
  teamId: string | undefined;
  teamName: string | undefined;
}

export interface PersonalRank {
  rank: number;
  totalPlayers: number;
  score: number;
  pointsBehindNext: number;
  nextPlayerName: string | null;
}

export interface HostControlAction {
  type: 'pause' | 'resume' | 'skip' | 'extend' | 'end' | 'edit_question' | 'insert_question' | 'lock' | 'unlock' | 'kick' | 'mute';
  payload?: unknown;
}

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
  effect: unknown;
}

export interface QuestionWithVariants extends Question {
  variants: QuestionVariant[];
  shuffledOptions: string[];
  shuffledOptionIndices: number[];
}

export const SCORE_BASE_POINTS = {
  [Difficulty.EASY]: 100,
  [Difficulty.MEDIUM]: 150,
  [Difficulty.HARD]: 200,
} as const;

export const SPEED_BONUS_MULTIPLIER = 0.5;
export const STREAK_BONUS_PER_CORRECT = 0.1;
export const MAX_STREAK_BONUS = 0.5;
export const LATENCY_CREDIT_MAX_MS = 300;
export const GRACE_WINDOW_MS = 500;
export const QR_ROTATION_INTERVAL = 30000;
export const LEADERBOARD_UPDATE_INTERVAL = 250;
export const MAX_PLAYERS_PER_ROOM = 50;