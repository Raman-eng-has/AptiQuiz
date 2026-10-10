import { Server, Socket } from 'socket.io';
import { PowerUpUseData, PowerUpUseResponse } from '../constants.js';
import { UserRole } from '@prisma/client';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handlePowerUpUse(io: Server, socket: AuthenticatedSocket, data: PowerUpUseData, callback: (response: PowerUpUseResponse) => void): Promise<void>;
export {};
//# sourceMappingURL=powerUp.d.ts.map