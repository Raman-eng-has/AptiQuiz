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
export declare const Difficulty: {
    readonly EASY: "EASY";
    readonly MEDIUM: "MEDIUM";
    readonly HARD: "HARD";
};
export declare const PowerUpType: {
    readonly DOUBLE_POINTS: "DOUBLE_POINTS";
    readonly FIFTY_FIFTY: "FIFTY_FIFTY";
    readonly TIME_FREEZE: "TIME_FREEZE";
};
export declare const RoomStatus: {
    readonly WAITING: "WAITING";
    readonly LIVE: "LIVE";
    readonly PAUSED: "PAUSED";
    readonly ENDED: "ENDED";
};
export declare const RoomJoinMode: {
    readonly ONLINE_LIVE: "ONLINE_LIVE";
    readonly OFFLINE_PHYSICAL: "OFFLINE_PHYSICAL";
    readonly SELF_PACED: "SELF_PACED";
};
export declare const IntegrityEventType: {
    readonly FOCUS_LOSS: "FOCUS_LOSS";
    readonly DEVTOOLS_DETECTED: "DEVTOOLS_DETECTED";
    readonly TOO_FAST_ANSWER: "TOO_FAST_ANSWER";
    readonly IDENTICAL_PATTERN: "IDENTICAL_PATTERN";
    readonly IMPOSSIBLE_ACCURACY: "IMPOSSIBLE_ACCURACY";
    readonly MULTIPLE_DEVICES: "MULTIPLE_DEVICES";
    readonly EXTENSION_MISSING: "EXTENSION_MISSING";
    readonly CLIPBOARD_ACCESS: "CLIPBOARD_ACCESS";
    readonly TAB_SWITCH: "TAB_SWITCH";
};
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
export declare const LEADERBOARD_UPDATE_INTERVAL = 250;
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
//# sourceMappingURL=constants.d.ts.map