import { Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handlePing(socket: AuthenticatedSocket, clientTime: number, callback: (serverTime: number) => void): Promise<void>;
export declare function handleSyncTime(socket: AuthenticatedSocket): Promise<void>;
export {};
//# sourceMappingURL=ping.d.ts.map