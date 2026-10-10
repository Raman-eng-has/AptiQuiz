import { Server, Socket } from 'socket.io';
import { HostControlAction, UserRole } from '../constants.js';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handleHostControl(io: Server, socket: AuthenticatedSocket, action: HostControlAction): Promise<void>;
export {};
//# sourceMappingURL=hostControl.d.ts.map