import { Server, Socket } from 'socket.io';
import { UserRole, JoinRoomData, JoinRoomResponse } from '../constants.js';
interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        roomId: string;
        playerId: string;
        role: UserRole;
    };
}
export declare function handleJoinRoom(io: Server, socket: AuthenticatedSocket, data: JoinRoomData, callback: (response: JoinRoomResponse) => void): Promise<void>;
export {};
//# sourceMappingURL=joinRoom.d.ts.map