import { Server, Socket } from 'socket.io';
import { SubmitAnswerData, SubmitAnswerResponse } from '../constants.js';
import { UserRole } from '@prisma/client';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handleSubmitAnswer(io: Server, socket: AuthenticatedSocket, data: SubmitAnswerData, callback: (response: SubmitAnswerResponse) => void): Promise<void>;
export {};
//# sourceMappingURL=submitAnswer.d.ts.map