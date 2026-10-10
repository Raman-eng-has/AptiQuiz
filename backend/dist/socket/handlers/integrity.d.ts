import { Server, Socket } from 'socket.io';
import { IntegrityEventType } from '../constants.js';
import { UserRole } from '@prisma/client';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handleIntegrityEvent(io: Server, socket: AuthenticatedSocket, event: {
    type: IntegrityEventType;
    details: Record<string, unknown>;
}): Promise<void>;
export declare function detectTooFastAnswer(roomId: string, playerId: string, questionId: string, timeTakenMs: number): Promise<void>;
export declare function detectIdenticalPatterns(roomId: string, playerId: string, questionIndex: number, answer: any, timeTakenMs: number): Promise<void>;
export declare function detectImpossibleAccuracy(playerId: string, roomId: string): Promise<void>;
export declare function detectMultipleDevices(roomId: string, userId: string): Promise<void>;
export {};
//# sourceMappingURL=integrity.d.ts.map