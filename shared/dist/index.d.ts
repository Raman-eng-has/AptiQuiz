import { z } from 'zod';
export declare enum UserRole {
    STUDENT = "STUDENT",
    HOST = "HOST",
    COLLEGE_ADMIN = "COLLEGE_ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum QuestionType {
    SINGLE_CHOICE = "SINGLE_CHOICE",
    MULTI_SELECT = "MULTI_SELECT",
    NUMERIC = "NUMERIC",
    SHORT_TEXT = "SHORT_TEXT",
    TRUE_FALSE = "TRUE_FALSE"
}
export declare enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}
export declare enum QuizVisibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    UNLISTED = "UNLISTED",
    COLLEGE_ONLY = "COLLEGE_ONLY"
}
export declare enum RoomJoinMode {
    ONLINE_LIVE = "ONLINE_LIVE",
    OFFLINE_PHYSICAL = "OFFLINE_PHYSICAL",
    SELF_PACED = "SELF_PACED"
}
export declare enum RoomStatus {
    WAITING = "WAITING",
    LIVE = "LIVE",
    PAUSED = "PAUSED",
    ENDED = "ENDED"
}
export declare enum PowerUpType {
    DOUBLE_POINTS = "DOUBLE_POINTS",
    FIFTY_FIFTY = "FIFTY_FIFTY",
    TIME_FREEZE = "TIME_FREEZE"
}
export declare enum BadgeType {
    FIRST_WIN = "FIRST_WIN",
    PODIUM = "PODIUM",
    SPEED_DEMON = "SPEED_DEMON",
    PERFECT_ROUND = "PERFECT_ROUND",
    STREAK_7 = "STREAK_7",
    STREAK_30 = "STREAK_30",
    TOPIC_MASTER = "TOPIC_MASTER",
    COMEBACK_KID = "COMEBACK_KID",
    GIANT_SLAYER = "GIANT_SLAYER",
    FAIR_PLAYER = "FAIR_PLAYER",
    TEAM_CHAMPION = "TEAM_CHAMPION",
    LEAGUE_TOP_10 = "LEAGUE_TOP_10"
}
export declare enum IntegrityEventType {
    FOCUS_LOSS = "FOCUS_LOSS",
    DEVTOOLS_DETECTED = "DEVTOOLS_DETECTED",
    TOO_FAST_ANSWER = "TOO_FAST_ANSWER",
    IDENTICAL_PATTERN = "IDENTICAL_PATTERN",
    IMPOSSIBLE_ACCURACY = "IMPOSSIBLE_ACCURACY",
    MULTIPLE_DEVICES = "MULTIPLE_DEVICES",
    EXTENSION_MISSING = "EXTENSION_MISSING",
    CLIPBOARD_ACCESS = "CLIPBOARD_ACCESS",
    TAB_SWITCH = "TAB_SWITCH"
}
export declare enum LeagueScope {
    ROOM = "ROOM",
    COLLEGE = "COLLEGE",
    BRANCH = "BRANCH",
    SEMESTER = "SEMESTER",
    YEAR = "YEAR",
    GLOBAL = "GLOBAL",
    OVERALL = "OVERALL",
    TOPIC = "TOPIC",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    SEASON = "SEASON"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    passwordHash: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
    role: z.ZodNativeEnum<typeof UserRole>;
    collegeId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodNumber>;
    year: z.ZodOptional<z.ZodNumber>;
    rating: z.ZodDefault<z.ZodNumber>;
    integrityScore: z.ZodDefault<z.ZodNumber>;
    streak: z.ZodDefault<z.ZodNumber>;
    longestStreak: z.ZodDefault<z.ZodNumber>;
    lastActiveDate: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    rating: number;
    integrityScore: number;
    streak: number;
    longestStreak: number;
    createdAt: Date;
    updatedAt: Date;
    passwordHash?: string | undefined;
    avatarUrl?: string | undefined;
    collegeId?: string | undefined;
    branchId?: string | undefined;
    semester?: number | undefined;
    year?: number | undefined;
    lastActiveDate?: Date | undefined;
}, {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    passwordHash?: string | undefined;
    avatarUrl?: string | undefined;
    collegeId?: string | undefined;
    branchId?: string | undefined;
    semester?: number | undefined;
    year?: number | undefined;
    rating?: number | undefined;
    integrityScore?: number | undefined;
    streak?: number | undefined;
    longestStreak?: number | undefined;
    lastActiveDate?: Date | undefined;
}>;
export declare const CollegeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    code: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    domain?: string | undefined;
    logoUrl?: string | undefined;
    address?: string | undefined;
}, {
    id: string;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    domain?: string | undefined;
    logoUrl?: string | undefined;
    address?: string | undefined;
}>;
export declare const BranchSchema: z.ZodObject<{
    id: z.ZodString;
    collegeId: z.ZodString;
    name: z.ZodString;
    code: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    code: string;
    collegeId: string;
    createdAt: Date;
    updatedAt: Date;
}, {
    id: string;
    name: string;
    code: string;
    collegeId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const SectionSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    semester: z.ZodNumber;
    year: z.ZodNumber;
    name: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    branchId: string;
    semester: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}, {
    id: string;
    name: string;
    branchId: string;
    semester: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const QuestionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    type: z.ZodNativeEnum<typeof QuestionType>;
    options: z.ZodArray<z.ZodString, "many">;
    correctAnswer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodNumber]>;
    explanation: z.ZodOptional<z.ZodString>;
    topic: z.ZodString;
    subtopic: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodNativeEnum<typeof Difficulty>;
    timeLimit: z.ZodNumber;
    points: z.ZodNumber;
    imageUrl: z.ZodOptional<z.ZodString>;
    tableData: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isParameterized: z.ZodDefault<z.ZodBoolean>;
    parameterTemplate: z.ZodOptional<z.ZodString>;
    parameterValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    acceptedAnswers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    numericTolerance: z.ZodOptional<z.ZodNumber>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    options: string[];
    type: QuestionType;
    createdAt: Date;
    updatedAt: Date;
    text: string;
    correctAnswer: string | number | string[];
    topic: string;
    difficulty: Difficulty;
    timeLimit: number;
    points: number;
    tags: string[];
    isParameterized: boolean;
    createdBy: string;
    explanation?: string | undefined;
    subtopic?: string | undefined;
    imageUrl?: string | undefined;
    tableData?: string | undefined;
    parameterTemplate?: string | undefined;
    parameterValues?: Record<string, number> | undefined;
    acceptedAnswers?: string[] | undefined;
    numericTolerance?: number | undefined;
}, {
    id: string;
    options: string[];
    type: QuestionType;
    createdAt: Date;
    updatedAt: Date;
    text: string;
    correctAnswer: string | number | string[];
    topic: string;
    difficulty: Difficulty;
    timeLimit: number;
    points: number;
    createdBy: string;
    explanation?: string | undefined;
    subtopic?: string | undefined;
    imageUrl?: string | undefined;
    tableData?: string | undefined;
    tags?: string[] | undefined;
    isParameterized?: boolean | undefined;
    parameterTemplate?: string | undefined;
    parameterValues?: Record<string, number> | undefined;
    acceptedAnswers?: string[] | undefined;
    numericTolerance?: number | undefined;
}>;
export declare const QuestionVariantSchema: z.ZodObject<{
    id: z.ZodString;
    questionId: z.ZodString;
    variantIndex: z.ZodNumber;
    parameterValues: z.ZodRecord<z.ZodString, z.ZodNumber>;
    renderedText: z.ZodString;
    renderedOptions: z.ZodArray<z.ZodString, "many">;
    correctAnswer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    correctAnswer: string | number | string[];
    parameterValues: Record<string, number>;
    questionId: string;
    variantIndex: number;
    renderedText: string;
    renderedOptions: string[];
}, {
    id: string;
    correctAnswer: string | number | string[];
    parameterValues: Record<string, number>;
    questionId: string;
    variantIndex: number;
    renderedText: string;
    renderedOptions: string[];
}>;
export declare const QuizSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    targetCollegeId: z.ZodOptional<z.ZodString>;
    targetBranchId: z.ZodOptional<z.ZodString>;
    targetSemester: z.ZodOptional<z.ZodNumber>;
    targetYear: z.ZodOptional<z.ZodNumber>;
    difficulty: z.ZodNativeEnum<typeof Difficulty>;
    visibility: z.ZodNativeEnum<typeof QuizVisibility>;
    timePerQuestion: z.ZodOptional<z.ZodNumber>;
    totalTimeLimit: z.ZodOptional<z.ZodNumber>;
    negativeMarking: z.ZodDefault<z.ZodNumber>;
    allowLateJoin: z.ZodDefault<z.ZodBoolean>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
    shuffleQuestions: z.ZodDefault<z.ZodBoolean>;
    shuffleOptions: z.ZodDefault<z.ZodBoolean>;
    enablePowerUps: z.ZodDefault<z.ZodBoolean>;
    adaptiveDifficulty: z.ZodDefault<z.ZodBoolean>;
    isPublished: z.ZodDefault<z.ZodBoolean>;
    createdBy: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    difficulty: Difficulty;
    tags: string[];
    createdBy: string;
    title: string;
    category: string;
    visibility: QuizVisibility;
    negativeMarking: number;
    allowLateJoin: boolean;
    maxPlayers: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enablePowerUps: boolean;
    adaptiveDifficulty: boolean;
    isPublished: boolean;
    description?: string | undefined;
    targetCollegeId?: string | undefined;
    targetBranchId?: string | undefined;
    targetSemester?: number | undefined;
    targetYear?: number | undefined;
    timePerQuestion?: number | undefined;
    totalTimeLimit?: number | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    difficulty: Difficulty;
    createdBy: string;
    title: string;
    category: string;
    visibility: QuizVisibility;
    tags?: string[] | undefined;
    description?: string | undefined;
    targetCollegeId?: string | undefined;
    targetBranchId?: string | undefined;
    targetSemester?: number | undefined;
    targetYear?: number | undefined;
    timePerQuestion?: number | undefined;
    totalTimeLimit?: number | undefined;
    negativeMarking?: number | undefined;
    allowLateJoin?: boolean | undefined;
    maxPlayers?: number | undefined;
    shuffleQuestions?: boolean | undefined;
    shuffleOptions?: boolean | undefined;
    enablePowerUps?: boolean | undefined;
    adaptiveDifficulty?: boolean | undefined;
    isPublished?: boolean | undefined;
}>;
export declare const QuizQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    quizId: z.ZodString;
    questionId: z.ZodString;
    order: z.ZodNumber;
    timeLimit: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    questionId: string;
    quizId: string;
    order: number;
    timeLimit?: number | undefined;
    points?: number | undefined;
}, {
    id: string;
    questionId: string;
    quizId: string;
    order: number;
    timeLimit?: number | undefined;
    points?: number | undefined;
}>;
export declare const RoomSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    quizId: z.ZodString;
    hostId: z.ZodString;
    collegeId: z.ZodOptional<z.ZodString>;
    joinMode: z.ZodNativeEnum<typeof RoomJoinMode>;
    status: z.ZodNativeEnum<typeof RoomStatus>;
    currentQuestionIndex: z.ZodDefault<z.ZodNumber>;
    questionStartTime: z.ZodOptional<z.ZodDate>;
    questionEndTime: z.ZodOptional<z.ZodDate>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
    allowLateJoin: z.ZodDefault<z.ZodBoolean>;
    requireLogin: z.ZodDefault<z.ZodBoolean>;
    physicalVenue: z.ZodOptional<z.ZodString>;
    geofenceCenter: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    geofenceRadius: z.ZodOptional<z.ZodNumber>;
    ipAllowlist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    qrRotationInterval: z.ZodDefault<z.ZodNumber>;
    currentQrCode: z.ZodOptional<z.ZodString>;
    qrCodeExpiresAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    endedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: RoomStatus;
    code: string;
    createdAt: Date;
    allowLateJoin: boolean;
    maxPlayers: number;
    quizId: string;
    hostId: string;
    joinMode: RoomJoinMode;
    currentQuestionIndex: number;
    requireLogin: boolean;
    ipAllowlist: string[];
    qrRotationInterval: number;
    collegeId?: string | undefined;
    questionStartTime?: Date | undefined;
    questionEndTime?: Date | undefined;
    physicalVenue?: string | undefined;
    geofenceCenter?: {
        lat: number;
        lng: number;
    } | undefined;
    geofenceRadius?: number | undefined;
    currentQrCode?: string | undefined;
    qrCodeExpiresAt?: Date | undefined;
    startedAt?: Date | undefined;
    endedAt?: Date | undefined;
}, {
    id: string;
    status: RoomStatus;
    code: string;
    createdAt: Date;
    quizId: string;
    hostId: string;
    joinMode: RoomJoinMode;
    collegeId?: string | undefined;
    allowLateJoin?: boolean | undefined;
    maxPlayers?: number | undefined;
    currentQuestionIndex?: number | undefined;
    questionStartTime?: Date | undefined;
    questionEndTime?: Date | undefined;
    requireLogin?: boolean | undefined;
    physicalVenue?: string | undefined;
    geofenceCenter?: {
        lat: number;
        lng: number;
    } | undefined;
    geofenceRadius?: number | undefined;
    ipAllowlist?: string[] | undefined;
    qrRotationInterval?: number | undefined;
    currentQrCode?: string | undefined;
    qrCodeExpiresAt?: Date | undefined;
    startedAt?: Date | undefined;
    endedAt?: Date | undefined;
}>;
export declare const RoomPlayerSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    nickname: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
    seatNumber: z.ZodOptional<z.ZodNumber>;
    score: z.ZodDefault<z.ZodNumber>;
    streak: z.ZodDefault<z.ZodNumber>;
    correctCount: z.ZodDefault<z.ZodNumber>;
    totalTime: z.ZodDefault<z.ZodNumber>;
    powerUpsUsed: z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof PowerUpType>, "many">>;
    powerUpsAvailable: z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof PowerUpType>, "many">>;
    isConnected: z.ZodDefault<z.ZodBoolean>;
    lastPingAt: z.ZodOptional<z.ZodDate>;
    latencyMs: z.ZodDefault<z.ZodNumber>;
    joinedAt: z.ZodDate;
    leftAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    streak: number;
    roomId: string;
    score: number;
    correctCount: number;
    totalTime: number;
    powerUpsUsed: PowerUpType[];
    powerUpsAvailable: PowerUpType[];
    isConnected: boolean;
    latencyMs: number;
    joinedAt: Date;
    userId?: string | undefined;
    nickname?: string | undefined;
    teamId?: string | undefined;
    seatNumber?: number | undefined;
    lastPingAt?: Date | undefined;
    leftAt?: Date | undefined;
}, {
    id: string;
    roomId: string;
    joinedAt: Date;
    streak?: number | undefined;
    userId?: string | undefined;
    nickname?: string | undefined;
    teamId?: string | undefined;
    seatNumber?: number | undefined;
    score?: number | undefined;
    correctCount?: number | undefined;
    totalTime?: number | undefined;
    powerUpsUsed?: PowerUpType[] | undefined;
    powerUpsAvailable?: PowerUpType[] | undefined;
    isConnected?: boolean | undefined;
    lastPingAt?: Date | undefined;
    latencyMs?: number | undefined;
    leftAt?: Date | undefined;
}>;
export declare const TeamSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    name: z.ZodString;
    color: z.ZodString;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: Date;
    roomId: string;
    color: string;
}, {
    id: string;
    name: string;
    createdAt: Date;
    roomId: string;
    color: string;
}>;
export declare const AnswerSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    playerId: z.ZodString;
    questionId: z.ZodString;
    questionIndex: z.ZodNumber;
    answer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodNumber]>;
    shuffledOptionIndices: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    submittedAt: z.ZodDate;
    serverReceivedAt: z.ZodDate;
    rttMs: z.ZodNumber;
    isCorrect: z.ZodBoolean;
    pointsEarned: z.ZodDefault<z.ZodNumber>;
    powerUpUsed: z.ZodOptional<z.ZodNativeEnum<typeof PowerUpType>>;
    sequenceId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    questionId: string;
    roomId: string;
    playerId: string;
    questionIndex: number;
    answer: string | number | string[];
    submittedAt: Date;
    serverReceivedAt: Date;
    rttMs: number;
    isCorrect: boolean;
    pointsEarned: number;
    sequenceId: number;
    shuffledOptionIndices?: number[] | undefined;
    powerUpUsed?: PowerUpType | undefined;
}, {
    id: string;
    questionId: string;
    roomId: string;
    playerId: string;
    questionIndex: number;
    answer: string | number | string[];
    submittedAt: Date;
    serverReceivedAt: Date;
    rttMs: number;
    isCorrect: boolean;
    sequenceId: number;
    shuffledOptionIndices?: number[] | undefined;
    pointsEarned?: number | undefined;
    powerUpUsed?: PowerUpType | undefined;
}>;
export declare const RoundResultSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    questionIndex: z.ZodNumber;
    questionId: z.ZodString;
    correctAnswer: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">, z.ZodNumber]>;
    explanation: z.ZodOptional<z.ZodString>;
    answerDistribution: z.ZodRecord<z.ZodString, z.ZodNumber>;
    accuracy: z.ZodNumber;
    averageTime: z.ZodNumber;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    correctAnswer: string | number | string[];
    questionId: string;
    roomId: string;
    questionIndex: number;
    answerDistribution: Record<string, number>;
    accuracy: number;
    averageTime: number;
    explanation?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    correctAnswer: string | number | string[];
    questionId: string;
    roomId: string;
    questionIndex: number;
    answerDistribution: Record<string, number>;
    accuracy: number;
    averageTime: number;
    explanation?: string | undefined;
}>;
export declare const LeagueSeasonSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    collegeId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    quizIds: z.ZodArray<z.ZodString, "many">;
    pointsScheme: z.ZodObject<{
        win: z.ZodDefault<z.ZodNumber>;
        participation: z.ZodDefault<z.ZodNumber>;
        accuracyBonus: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        win: number;
        participation: number;
        accuracyBonus: number;
    }, {
        win?: number | undefined;
        participation?: number | undefined;
        accuracyBonus?: number | undefined;
    }>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    startDate: Date;
    endDate: Date;
    quizIds: string[];
    pointsScheme: {
        win: number;
        participation: number;
        accuracyBonus: number;
    };
    isActive: boolean;
    collegeId?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    startDate: Date;
    endDate: Date;
    quizIds: string[];
    pointsScheme: {
        win?: number | undefined;
        participation?: number | undefined;
        accuracyBonus?: number | undefined;
    };
    collegeId?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const LeagueScoreSchema: z.ZodObject<{
    id: z.ZodString;
    seasonId: z.ZodString;
    userId: z.ZodString;
    collegeId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    totalScore: z.ZodDefault<z.ZodNumber>;
    quizzesPlayed: z.ZodDefault<z.ZodNumber>;
    totalCorrect: z.ZodDefault<z.ZodNumber>;
    averageAccuracy: z.ZodDefault<z.ZodNumber>;
    averageTime: z.ZodDefault<z.ZodNumber>;
    rank: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    updatedAt: Date;
    userId: string;
    averageTime: number;
    seasonId: string;
    totalScore: number;
    quizzesPlayed: number;
    totalCorrect: number;
    averageAccuracy: number;
    collegeId?: string | undefined;
    branchId?: string | undefined;
    rank?: number | undefined;
}, {
    id: string;
    updatedAt: Date;
    userId: string;
    seasonId: string;
    collegeId?: string | undefined;
    branchId?: string | undefined;
    averageTime?: number | undefined;
    totalScore?: number | undefined;
    quizzesPlayed?: number | undefined;
    totalCorrect?: number | undefined;
    averageAccuracy?: number | undefined;
    rank?: number | undefined;
}>;
export declare const BadgeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof BadgeType>;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    rarity: z.ZodEnum<["COMMON", "RARE", "EPIC", "LEGENDARY"]>;
    criteria: z.ZodString;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: BadgeType;
    createdAt: Date;
    description: string;
    icon: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    criteria: string;
}, {
    id: string;
    name: string;
    type: BadgeType;
    createdAt: Date;
    description: string;
    icon: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
    criteria: string;
}>;
export declare const UserBadgeSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    badgeId: z.ZodString;
    earnedAt: z.ZodDate;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    badgeId: string;
    earnedAt: Date;
    context?: string | undefined;
}, {
    id: string;
    userId: string;
    badgeId: string;
    earnedAt: Date;
    context?: string | undefined;
}>;
export declare const IntegrityEventSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    playerId: z.ZodString;
    type: z.ZodNativeEnum<typeof IntegrityEventType>;
    severity: z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>;
    details: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodDate;
    reviewed: z.ZodDefault<z.ZodBoolean>;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    action: z.ZodDefault<z.ZodEnum<["NONE", "WARNING", "SCORE_DEDUCTION", "EXCLUDE_FROM_LEAGUE"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: IntegrityEventType;
    roomId: string;
    playerId: string;
    severity: "MEDIUM" | "LOW" | "HIGH";
    details: Record<string, unknown>;
    timestamp: Date;
    reviewed: boolean;
    action: "NONE" | "WARNING" | "SCORE_DEDUCTION" | "EXCLUDE_FROM_LEAGUE";
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
}, {
    id: string;
    type: IntegrityEventType;
    roomId: string;
    playerId: string;
    severity: "MEDIUM" | "LOW" | "HIGH";
    details: Record<string, unknown>;
    timestamp: Date;
    reviewed?: boolean | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
    action?: "NONE" | "WARNING" | "SCORE_DEDUCTION" | "EXCLUDE_FROM_LEAGUE" | undefined;
}>;
export declare const PowerUpUseSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    playerId: z.ZodString;
    questionIndex: z.ZodNumber;
    type: z.ZodNativeEnum<typeof PowerUpType>;
    usedAt: z.ZodDate;
    wasSuccessful: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: PowerUpType;
    roomId: string;
    playerId: string;
    questionIndex: number;
    usedAt: Date;
    wasSuccessful: boolean;
}, {
    id: string;
    type: PowerUpType;
    roomId: string;
    playerId: string;
    questionIndex: number;
    usedAt: Date;
    wasSuccessful: boolean;
}>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    action: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodOptional<z.ZodString>;
    oldValue: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    newValue: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    userId: string;
    action: string;
    entityType: string;
    roomId?: string | undefined;
    entityId?: string | undefined;
    oldValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    userId: string;
    action: string;
    entityType: string;
    roomId?: string | undefined;
    entityId?: string | undefined;
    oldValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export declare const DailyChallengeSchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodDate;
    quizId: z.ZodString;
    streakFreezeUsed: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    date: Date;
    createdAt: Date;
    quizId: string;
    streakFreezeUsed: number;
}, {
    id: string;
    date: Date;
    createdAt: Date;
    quizId: string;
    streakFreezeUsed?: number | undefined;
}>;
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
export declare const SocketEvents: {
    readonly JOIN_ROOM: "join_room";
    readonly LEAVE_ROOM: "leave_room";
    readonly PLAYER_JOINED: "player_joined";
    readonly PLAYER_LEFT: "player_left";
    readonly PLAYER_RECONNECTED: "player_reconnected";
    readonly ROOM_STATE: "room_state";
    readonly QUESTION_START: "question_start";
    readonly QUESTION_END: "question_end";
    readonly SUBMIT_ANSWER: "submit_answer";
    readonly ANSWER_RECEIVED: "answer_received";
    readonly ROUND_RESULT: "round_result";
    readonly LEADERBOARD_UPDATE: "leaderboard_update";
    readonly PERSONAL_RANK_UPDATE: "personal_rank_update";
    readonly HOST_CONTROL: "host_control";
    readonly HOST_KICK: "host_kick";
    readonly HOST_MUTE: "host_mute";
    readonly HOST_LOCK: "host_lock";
    readonly HOST_EXTEND_TIME: "host_extend_time";
    readonly HOST_SKIP_QUESTION: "host_skip_question";
    readonly HOST_END_EARLY: "host_end_early";
    readonly HOST_EDIT_QUESTION: "host_edit_question";
    readonly HOST_INSERT_QUESTION: "host_insert_question";
    readonly POWER_UP_USE: "power_up_use";
    readonly POWER_UP_RESULT: "power_up_result";
    readonly PING: "ping";
    readonly PONG: "pong";
    readonly SYNC_TIME: "sync_time";
    readonly ERROR: "error";
    readonly INTEGRITY_EVENT: "integrity_event";
    readonly QR_CODE_ROTATION: "qr_code_rotation";
};
export type SocketEvent = typeof SocketEvents[keyof typeof SocketEvents];
export interface ServerToClientEvents {
    player_joined: (player: RoomPlayer & {
        user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    }) => void;
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
    error: (error: {
        code: string;
        message: string;
    }) => void;
    integrity_event: (event: IntegrityEvent) => void;
    qr_code_rotation: (data: {
        code: string;
        expiresAt: number;
    }) => void;
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
    players: (RoomPlayer & {
        user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    })[];
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
export declare const SCORE_BASE_POINTS: {
    readonly EASY: 100;
    readonly MEDIUM: 150;
    readonly HARD: 200;
};
export declare const SPEED_BONUS_MULTIPLIER = 0.5;
export declare const STREAK_BONUS_PER_CORRECT = 0.1;
export declare const MAX_STREAK_BONUS = 0.5;
export declare const LATENCY_CREDIT_MAX_MS = 300;
export declare const GRACE_WINDOW_MS = 500;
export declare const QR_ROTATION_INTERVAL = 30000;
export declare const LEADERBOARD_UPDATE_INTERVAL = 250;
export declare const MAX_PLAYERS_PER_ROOM = 50;
//# sourceMappingURL=index.d.ts.map