"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJoinRoom = handleJoinRoom;
const index_js_1 = require("../../index.js");
const constants_js_1 = require("../constants.js");
async function handleJoinRoom(io, socket, data, callback) {
    try {
        const room = await index_js_1.prisma.room.findUnique({
            where: { code: data.code.toUpperCase() },
            include: {
                quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
                players: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, team: true } },
                teams: { include: { members: { include: { user: { select: { id: true, name: true } } } } } },
            },
        });
        if (!room) {
            return callback({ success: false, error: 'Invalid room code' });
        }
        if (room.status === constants_js_1.RoomStatus.ENDED) {
            return callback({ success: false, error: 'Quiz has ended' });
        }
        if (!room.allowLateJoin && room.status === constants_js_1.RoomStatus.LIVE) {
            return callback({ success: false, error: 'Late join not allowed' });
        }
        if (room.players.length >= room.maxPlayers) {
            return callback({ success: false, error: 'Room is full' });
        }
        if (room.requireLogin && !data.userId) {
            return callback({ success: false, error: 'Login required to join this room' });
        }
        let player = await index_js_1.prisma.roomPlayer.findFirst({
            where: { roomId: room.id, userId: socket.data.userId },
        });
        if (player) {
            await index_js_1.prisma.roomPlayer.update({
                where: { id: player.id },
                data: { isConnected: true, leftAt: null, lastPingAt: new Date() },
            });
        }
        else {
            const seatNumber = room.players.length + 1;
            player = await index_js_1.prisma.roomPlayer.create({
                data: {
                    roomId: room.id,
                    userId: socket.data.userId,
                    nickname: data.nickname,
                    teamId: data.teamId,
                    seatNumber,
                    powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'],
                },
            });
        }
        socket.join(room.id);
        socket.data.roomId = room.id;
        socket.data.playerId = player.id;
        await index_js_1.prisma.auditLog.create({
            data: { userId: socket.data.userId, action: 'JOIN_ROOM', entityType: 'RoomPlayer', entityId: player.id, roomId: room.id },
        });
        const roomState = await buildRoomState(room, player.id);
        io.to(room.id).emit(constants_js_1.SocketEvents.PLAYER_JOINED, {
            ...player,
            user: player.userId ? { id: socket.data.userId, name: socket.data.userId, avatarUrl: undefined } : undefined,
        });
        if (room.status === constants_js_1.RoomStatus.WAITING && room.hostId === socket.data.userId) {
        }
        callback({ success: true, playerId: player.id, roomState });
    }
    catch (error) {
        console.error('Join room error:', error);
        callback({ success: false, error: 'Failed to join room' });
    }
}
async function buildRoomState(room, currentPlayerId) {
    const currentQuestion = room.currentQuestionIndex >= 0
        ? room.quiz.questions[room.currentQuestionIndex]
        : null;
    const timeRemaining = room.questionEndTime
        ? Math.max(0, Math.ceil((room.questionEndTime.getTime() - Date.now()) / 1000))
        : 0;
    return {
        room: { ...room, quiz: undefined, players: undefined, teams: undefined },
        players: room.players,
        teams: room.teams,
        currentQuestion: currentQuestion ? { ...currentQuestion.question } : null,
        questionIndex: room.currentQuestionIndex,
        timeRemaining,
        status: room.status,
    };
}
