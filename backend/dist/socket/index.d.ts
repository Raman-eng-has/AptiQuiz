import { Server } from 'socket.io';
declare const roomTimers: Map<string, NodeJS.Timeout>;
declare const leaderboardIntervals: Map<string, NodeJS.Timeout>;
export declare function setupSocketHandlers(io: Server): void;
export declare function broadcastRoomState(io: Server, roomId: string): Promise<void>;
export declare function startQuestionTimer(io: Server, roomId: string, questionIndex: number, timeLimit: number): Promise<void>;
declare function endQuestion(io: Server, roomId: string, questionIndex: number): Promise<void>;
declare function broadcastLeaderboardUpdate(io: Server, roomId: string): Promise<void>;
export { endQuestion, broadcastLeaderboardUpdate, startQuestionTimer, roomTimers, leaderboardIntervals };
//# sourceMappingURL=index.d.ts.map