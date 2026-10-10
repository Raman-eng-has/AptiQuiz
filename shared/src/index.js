"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PLAYERS_PER_ROOM = exports.LEADERBOARD_UPDATE_INTERVAL = exports.QR_ROTATION_INTERVAL = exports.GRACE_WINDOW_MS = exports.LATENCY_CREDIT_MAX_MS = exports.MAX_STREAK_BONUS = exports.STREAK_BONUS_PER_CORRECT = exports.SPEED_BONUS_MULTIPLIER = exports.SCORE_BASE_POINTS = exports.SocketEvents = exports.DailyChallengeSchema = exports.AuditLogSchema = exports.PowerUpUseSchema = exports.IntegrityEventSchema = exports.UserBadgeSchema = exports.BadgeSchema = exports.LeagueScoreSchema = exports.LeagueSeasonSchema = exports.RoundResultSchema = exports.AnswerSchema = exports.TeamSchema = exports.RoomPlayerSchema = exports.RoomSchema = exports.QuizQuestionSchema = exports.QuizSchema = exports.QuestionVariantSchema = exports.QuestionSchema = exports.SectionSchema = exports.BranchSchema = exports.CollegeSchema = exports.UserSchema = exports.LeagueScope = exports.IntegrityEventType = exports.BadgeType = exports.PowerUpType = exports.RoomStatus = exports.RoomJoinMode = exports.QuizVisibility = exports.Difficulty = exports.QuestionType = exports.UserRole = void 0;
const zod_1 = require("zod");
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "STUDENT";
    UserRole["HOST"] = "HOST";
    UserRole["COLLEGE_ADMIN"] = "COLLEGE_ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var QuestionType;
(function (QuestionType) {
    QuestionType["SINGLE_CHOICE"] = "SINGLE_CHOICE";
    QuestionType["MULTI_SELECT"] = "MULTI_SELECT";
    QuestionType["NUMERIC"] = "NUMERIC";
    QuestionType["SHORT_TEXT"] = "SHORT_TEXT";
    QuestionType["TRUE_FALSE"] = "TRUE_FALSE";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
})(Difficulty || (exports.Difficulty = Difficulty = {}));
var QuizVisibility;
(function (QuizVisibility) {
    QuizVisibility["PUBLIC"] = "PUBLIC";
    QuizVisibility["PRIVATE"] = "PRIVATE";
    QuizVisibility["UNLISTED"] = "UNLISTED";
    QuizVisibility["COLLEGE_ONLY"] = "COLLEGE_ONLY";
})(QuizVisibility || (exports.QuizVisibility = QuizVisibility = {}));
var RoomJoinMode;
(function (RoomJoinMode) {
    RoomJoinMode["ONLINE_LIVE"] = "ONLINE_LIVE";
    RoomJoinMode["OFFLINE_PHYSICAL"] = "OFFLINE_PHYSICAL";
    RoomJoinMode["SELF_PACED"] = "SELF_PACED";
})(RoomJoinMode || (exports.RoomJoinMode = RoomJoinMode = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["WAITING"] = "WAITING";
    RoomStatus["LIVE"] = "LIVE";
    RoomStatus["PAUSED"] = "PAUSED";
    RoomStatus["ENDED"] = "ENDED";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var PowerUpType;
(function (PowerUpType) {
    PowerUpType["DOUBLE_POINTS"] = "DOUBLE_POINTS";
    PowerUpType["FIFTY_FIFTY"] = "FIFTY_FIFTY";
    PowerUpType["TIME_FREEZE"] = "TIME_FREEZE";
})(PowerUpType || (exports.PowerUpType = PowerUpType = {}));
var BadgeType;
(function (BadgeType) {
    BadgeType["FIRST_WIN"] = "FIRST_WIN";
    BadgeType["PODIUM"] = "PODIUM";
    BadgeType["SPEED_DEMON"] = "SPEED_DEMON";
    BadgeType["PERFECT_ROUND"] = "PERFECT_ROUND";
    BadgeType["STREAK_7"] = "STREAK_7";
    BadgeType["STREAK_30"] = "STREAK_30";
    BadgeType["TOPIC_MASTER"] = "TOPIC_MASTER";
    BadgeType["COMEBACK_KID"] = "COMEBACK_KID";
    BadgeType["GIANT_SLAYER"] = "GIANT_SLAYER";
    BadgeType["FAIR_PLAYER"] = "FAIR_PLAYER";
    BadgeType["TEAM_CHAMPION"] = "TEAM_CHAMPION";
    BadgeType["LEAGUE_TOP_10"] = "LEAGUE_TOP_10";
})(BadgeType || (exports.BadgeType = BadgeType = {}));
var IntegrityEventType;
(function (IntegrityEventType) {
    IntegrityEventType["FOCUS_LOSS"] = "FOCUS_LOSS";
    IntegrityEventType["DEVTOOLS_DETECTED"] = "DEVTOOLS_DETECTED";
    IntegrityEventType["TOO_FAST_ANSWER"] = "TOO_FAST_ANSWER";
    IntegrityEventType["IDENTICAL_PATTERN"] = "IDENTICAL_PATTERN";
    IntegrityEventType["IMPOSSIBLE_ACCURACY"] = "IMPOSSIBLE_ACCURACY";
    IntegrityEventType["MULTIPLE_DEVICES"] = "MULTIPLE_DEVICES";
    IntegrityEventType["EXTENSION_MISSING"] = "EXTENSION_MISSING";
    IntegrityEventType["CLIPBOARD_ACCESS"] = "CLIPBOARD_ACCESS";
    IntegrityEventType["TAB_SWITCH"] = "TAB_SWITCH";
})(IntegrityEventType || (exports.IntegrityEventType = IntegrityEventType = {}));
var LeagueScope;
(function (LeagueScope) {
    LeagueScope["ROOM"] = "ROOM";
    LeagueScope["COLLEGE"] = "COLLEGE";
    LeagueScope["BRANCH"] = "BRANCH";
    LeagueScope["SEMESTER"] = "SEMESTER";
    LeagueScope["YEAR"] = "YEAR";
    LeagueScope["GLOBAL"] = "GLOBAL";
    LeagueScope["OVERALL"] = "OVERALL";
    LeagueScope["TOPIC"] = "TOPIC";
    LeagueScope["DAILY"] = "DAILY";
    LeagueScope["WEEKLY"] = "WEEKLY";
    LeagueScope["MONTHLY"] = "MONTHLY";
    LeagueScope["SEASON"] = "SEASON";
})(LeagueScope || (exports.LeagueScope = LeagueScope = {}));
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    passwordHash: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).max(100),
    avatarUrl: zod_1.z.string().url().optional(),
    role: zod_1.z.nativeEnum(UserRole),
    collegeId: zod_1.z.string().uuid().optional(),
    branchId: zod_1.z.string().uuid().optional(),
    semester: zod_1.z.number().int().min(1).max(8).optional(),
    year: zod_1.z.number().int().min(1).max(4).optional(),
    rating: zod_1.z.number().default(1200),
    integrityScore: zod_1.z.number().min(0).max(100).default(100),
    streak: zod_1.z.number().int().default(0),
    longestStreak: zod_1.z.number().int().default(0),
    lastActiveDate: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CollegeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(200),
    code: zod_1.z.string().min(2).max(20).toUpperCase(),
    domain: zod_1.z.string().optional(),
    logoUrl: zod_1.z.string().url().optional(),
    address: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.BranchSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    collegeId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    code: zod_1.z.string().min(2).max(10).toUpperCase(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.SectionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    semester: zod_1.z.number().int().min(1).max(8),
    year: zod_1.z.number().int().min(1).max(4),
    name: zod_1.z.string().min(1).max(50),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.QuestionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    text: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(QuestionType),
    options: zod_1.z.array(zod_1.z.string()).min(2).max(6),
    correctAnswer: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.number()]),
    explanation: zod_1.z.string().optional(),
    topic: zod_1.z.string().min(1).max(100),
    subtopic: zod_1.z.string().min(1).max(100).optional(),
    difficulty: zod_1.z.nativeEnum(Difficulty),
    timeLimit: zod_1.z.number().int().min(5).max(300),
    points: zod_1.z.number().int().min(10).max(500),
    imageUrl: zod_1.z.string().url().optional(),
    tableData: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isParameterized: zod_1.z.boolean().default(false),
    parameterTemplate: zod_1.z.string().optional(),
    parameterValues: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
    acceptedAnswers: zod_1.z.array(zod_1.z.string()).optional(),
    numericTolerance: zod_1.z.number().optional(),
    createdBy: zod_1.z.string().uuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.QuestionVariantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    questionId: zod_1.z.string().uuid(),
    variantIndex: zod_1.z.number().int(),
    parameterValues: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    renderedText: zod_1.z.string(),
    renderedOptions: zod_1.z.array(zod_1.z.string()),
    correctAnswer: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.number()]),
});
exports.QuizSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1).max(100),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    targetCollegeId: zod_1.z.string().uuid().optional(),
    targetBranchId: zod_1.z.string().uuid().optional(),
    targetSemester: zod_1.z.number().int().min(1).max(8).optional(),
    targetYear: zod_1.z.number().int().min(1).max(4).optional(),
    difficulty: zod_1.z.nativeEnum(Difficulty),
    visibility: zod_1.z.nativeEnum(QuizVisibility),
    timePerQuestion: zod_1.z.number().int().min(5).max(300).optional(),
    totalTimeLimit: zod_1.z.number().int().min(60).max(7200).optional(),
    negativeMarking: zod_1.z.number().min(0).max(1).default(0),
    allowLateJoin: zod_1.z.boolean().default(true),
    maxPlayers: zod_1.z.number().int().min(2).max(500).default(50),
    shuffleQuestions: zod_1.z.boolean().default(false),
    shuffleOptions: zod_1.z.boolean().default(true),
    enablePowerUps: zod_1.z.boolean().default(true),
    adaptiveDifficulty: zod_1.z.boolean().default(false),
    isPublished: zod_1.z.boolean().default(false),
    createdBy: zod_1.z.string().uuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.QuizQuestionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    quizId: zod_1.z.string().uuid(),
    questionId: zod_1.z.string().uuid(),
    order: zod_1.z.number().int(),
    timeLimit: zod_1.z.number().int().optional(),
    points: zod_1.z.number().int().optional(),
});
exports.RoomSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string().length(6).regex(/^[A-HJ-NP-Z2-9]{6}$/),
    quizId: zod_1.z.string().uuid(),
    hostId: zod_1.z.string().uuid(),
    collegeId: zod_1.z.string().uuid().optional(),
    joinMode: zod_1.z.nativeEnum(RoomJoinMode),
    status: zod_1.z.nativeEnum(RoomStatus),
    currentQuestionIndex: zod_1.z.number().int().default(-1),
    questionStartTime: zod_1.z.date().optional(),
    questionEndTime: zod_1.z.date().optional(),
    maxPlayers: zod_1.z.number().int().min(2).max(500).default(50),
    allowLateJoin: zod_1.z.boolean().default(true),
    requireLogin: zod_1.z.boolean().default(false),
    physicalVenue: zod_1.z.string().optional(),
    geofenceCenter: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
    geofenceRadius: zod_1.z.number().optional(),
    ipAllowlist: zod_1.z.array(zod_1.z.string()).default([]),
    qrRotationInterval: zod_1.z.number().int().default(30),
    currentQrCode: zod_1.z.string().optional(),
    qrCodeExpiresAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    startedAt: zod_1.z.date().optional(),
    endedAt: zod_1.z.date().optional(),
});
exports.RoomPlayerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().optional(),
    nickname: zod_1.z.string().min(1).max(50).optional(),
    teamId: zod_1.z.string().uuid().optional(),
    seatNumber: zod_1.z.number().int().optional(),
    score: zod_1.z.number().default(0),
    streak: zod_1.z.number().int().default(0),
    correctCount: zod_1.z.number().int().default(0),
    totalTime: zod_1.z.number().default(0),
    powerUpsUsed: zod_1.z.array(zod_1.z.nativeEnum(PowerUpType)).default([]),
    powerUpsAvailable: zod_1.z.array(zod_1.z.nativeEnum(PowerUpType)).default([
        PowerUpType.DOUBLE_POINTS,
        PowerUpType.FIFTY_FIFTY,
        PowerUpType.TIME_FREEZE,
    ]),
    isConnected: zod_1.z.boolean().default(true),
    lastPingAt: zod_1.z.date().optional(),
    latencyMs: zod_1.z.number().int().default(0),
    joinedAt: zod_1.z.date(),
    leftAt: zod_1.z.date().optional(),
});
exports.TeamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(50),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    createdAt: zod_1.z.date(),
});
exports.AnswerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
    questionId: zod_1.z.string().uuid(),
    questionIndex: zod_1.z.number().int(),
    answer: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.number()]),
    shuffledOptionIndices: zod_1.z.array(zod_1.z.number().int()).optional(),
    submittedAt: zod_1.z.date(),
    serverReceivedAt: zod_1.z.date(),
    rttMs: zod_1.z.number().int(),
    isCorrect: zod_1.z.boolean(),
    pointsEarned: zod_1.z.number().default(0),
    powerUpUsed: zod_1.z.nativeEnum(PowerUpType).optional(),
    sequenceId: zod_1.z.number().int(),
});
exports.RoundResultSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    questionIndex: zod_1.z.number().int(),
    questionId: zod_1.z.string().uuid(),
    correctAnswer: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string()), zod_1.z.number()]),
    explanation: zod_1.z.string().optional(),
    answerDistribution: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    accuracy: zod_1.z.number().min(0).max(1),
    averageTime: zod_1.z.number(),
    createdAt: zod_1.z.date(),
});
exports.LeagueSeasonSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(200),
    collegeId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    quizIds: zod_1.z.array(zod_1.z.string().uuid()),
    pointsScheme: zod_1.z.object({
        win: zod_1.z.number().default(100),
        participation: zod_1.z.number().default(10),
        accuracyBonus: zod_1.z.number().default(50),
    }),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.LeagueScoreSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    seasonId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    collegeId: zod_1.z.string().uuid().optional(),
    branchId: zod_1.z.string().uuid().optional(),
    totalScore: zod_1.z.number().default(0),
    quizzesPlayed: zod_1.z.number().int().default(0),
    totalCorrect: zod_1.z.number().int().default(0),
    averageAccuracy: zod_1.z.number().min(0).max(1).default(0),
    averageTime: zod_1.z.number().default(0),
    rank: zod_1.z.number().int().optional(),
    updatedAt: zod_1.z.date(),
});
exports.BadgeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(BadgeType),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string(),
    icon: zod_1.z.string(),
    rarity: zod_1.z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
    criteria: zod_1.z.string(),
    createdAt: zod_1.z.date(),
});
exports.UserBadgeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    badgeId: zod_1.z.string().uuid(),
    earnedAt: zod_1.z.date(),
    context: zod_1.z.string().optional(),
});
exports.IntegrityEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(IntegrityEventType),
    severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    details: zod_1.z.record(zod_1.z.unknown()),
    timestamp: zod_1.z.date(),
    reviewed: zod_1.z.boolean().default(false),
    reviewedBy: zod_1.z.string().uuid().optional(),
    reviewedAt: zod_1.z.date().optional(),
    action: zod_1.z.enum(['NONE', 'WARNING', 'SCORE_DEDUCTION', 'EXCLUDE_FROM_LEAGUE']).default('NONE'),
});
exports.PowerUpUseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid(),
    playerId: zod_1.z.string().uuid(),
    questionIndex: zod_1.z.number().int(),
    type: zod_1.z.nativeEnum(PowerUpType),
    usedAt: zod_1.z.date(),
    wasSuccessful: zod_1.z.boolean(),
});
exports.AuditLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roomId: zod_1.z.string().uuid().optional(),
    userId: zod_1.z.string().uuid(),
    action: zod_1.z.string(),
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string().optional(),
    oldValue: zod_1.z.record(zod_1.z.unknown()).optional(),
    newValue: zod_1.z.record(zod_1.z.unknown()).optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
});
exports.DailyChallengeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    date: zod_1.z.date(),
    quizId: zod_1.z.string().uuid(),
    streakFreezeUsed: zod_1.z.number().int().default(0),
    createdAt: zod_1.z.date(),
});
exports.SocketEvents = {
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
};
exports.SCORE_BASE_POINTS = {
    [Difficulty.EASY]: 100,
    [Difficulty.MEDIUM]: 150,
    [Difficulty.HARD]: 200,
};
exports.SPEED_BONUS_MULTIPLIER = 0.5;
exports.STREAK_BONUS_PER_CORRECT = 0.1;
exports.MAX_STREAK_BONUS = 0.5;
exports.LATENCY_CREDIT_MAX_MS = 300;
exports.GRACE_WINDOW_MS = 500;
exports.QR_ROTATION_INTERVAL = 30000;
exports.LEADERBOARD_UPDATE_INTERVAL = 250;
exports.MAX_PLAYERS_PER_ROOM = 50;
