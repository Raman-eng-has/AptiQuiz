"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHostControl = handleHostControl;
const index_js_1 = require("../../index.js");
const constants_js_1 = require("../constants.js");
const index_js_2 = require("../index.js");
async function handleHostControl(io, socket, action) {
    try {
        const { roomId, userId, role } = socket.data;
        if (!roomId)
            return;
        const room = await index_js_1.prisma.room.findUnique({ where: { id: roomId } });
        if (!room)
            return;
        if (room.hostId !== userId && role !== constants_js_1.UserRole.SUPER_ADMIN)
            return;
        switch (action.type) {
            case 'pause': {
                if (room.status !== constants_js_1.RoomStatus.LIVE)
                    break;
                await index_js_1.prisma.room.update({ where: { id: roomId }, data: { status: constants_js_1.RoomStatus.PAUSED } });
                const timer = index_js_2.roomTimers.get(roomId);
                if (timer)
                    clearTimeout(timer);
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'pause' });
                break;
            }
            case 'resume': {
                if (room.status !== constants_js_1.RoomStatus.PAUSED)
                    break;
                await index_js_1.prisma.room.update({ where: { id: roomId }, data: { status: constants_js_1.RoomStatus.LIVE } });
                const question = room.quiz?.questions?.[room.currentQuestionIndex];
                if (question) {
                    const timeLimit = question.timeLimit || question.question?.timeLimit;
                    const remaining = room.questionEndTime ? Math.max(0, Math.ceil((room.questionEndTime.getTime() - Date.now()) / 1000)) : timeLimit;
                    await (0, index_js_2.startQuestionTimer)(io, roomId, room.currentQuestionIndex, remaining);
                }
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'resume' });
                break;
            }
            case 'skip': {
                const timer = index_js_2.roomTimers.get(roomId);
                if (timer)
                    clearTimeout(timer);
                await (0, index_js_2.endQuestion)(io, roomId, room.currentQuestionIndex);
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'skip' });
                break;
            }
            case 'extend': {
                const { additionalSeconds = 30 } = action.payload;
                const newEndTime = Date.now() + additionalSeconds * 1000;
                await index_js_1.prisma.room.update({ where: { id: roomId }, data: { questionEndTime: new Date(newEndTime) } });
                const timer = index_js_2.roomTimers.get(roomId);
                if (timer)
                    clearTimeout(timer);
                const newTimer = setTimeout(() => (0, index_js_2.endQuestion)(io, roomId, room.currentQuestionIndex), additionalSeconds * 1000);
                index_js_2.roomTimers.set(roomId, newTimer);
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'extend', payload: { additionalSeconds } });
                break;
            }
            case 'end': {
                await endQuiz(io, roomId);
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'end' });
                break;
            }
            case 'lock': {
                await index_js_1.prisma.room.update({ where: { id: roomId }, data: { allowLateJoin: false } });
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'lock' });
                break;
            }
            case 'unlock': {
                await index_js_1.prisma.room.update({ where: { id: roomId }, data: { allowLateJoin: true } });
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'unlock' });
                break;
            }
            case 'kick': {
                const { targetPlayerId } = action.payload;
                await index_js_1.prisma.roomPlayer.update({ where: { id: targetPlayerId }, data: { isConnected: false, leftAt: new Date() } });
                io.to(targetPlayerId).emit(constants_js_1.SocketEvents.ERROR, { code: 'KICKED', message: 'You have been kicked by the host' });
                io.to(roomId).emit(constants_js_1.SocketEvents.PLAYER_LEFT, targetPlayerId, 'kicked');
                break;
            }
            case 'mute': {
                const { targetPlayerId } = action.payload;
                io.to(targetPlayerId).emit(constants_js_1.SocketEvents.ERROR, { code: 'MUTED', message: 'You have been muted by the host' });
                io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'mute', payload: { targetPlayerId } });
                break;
            }
            case 'edit_question': {
                const { questionIndex, newQuestionId } = action.payload;
                if (questionIndex > room.currentQuestionIndex) {
                    await index_js_1.prisma.quizQuestion.update({
                        where: { quizId_questionId: { quizId: room.quizId, questionId: newQuestionId } },
                        data: { order: questionIndex },
                    });
                    await index_js_1.prisma.auditLog.create({
                        data: { userId, action: 'EDIT_QUESTION', entityType: 'QuizQuestion', entityId: newQuestionId, roomId, newValue: { questionIndex, newQuestionId } },
                    });
                    io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'edit_question', payload: { questionIndex, newQuestionId } });
                }
                break;
            }
            case 'insert_question': {
                const { questionIndex, newQuestionId } = action.payload;
                if (questionIndex > room.currentQuestionIndex) {
                    await index_js_1.prisma.quizQuestion.create({
                        data: { quizId: room.quizId, questionId: newQuestionId, order: questionIndex },
                    });
                    await index_js_1.prisma.auditLog.create({
                        data: { userId, action: 'INSERT_QUESTION', entityType: 'QuizQuestion', entityId: newQuestionId, roomId, newValue: { questionIndex, newQuestionId } },
                    });
                    io.to(roomId).emit(constants_js_1.SocketEvents.HOST_CONTROL, { type: 'insert_question', payload: { questionIndex, newQuestionId } });
                }
                break;
            }
        }
        await (0, index_js_2.broadcastRoomState)(io, roomId);
    }
    catch (error) {
        console.error('Host control error:', error);
    }
}
async function endQuiz(io, roomId) {
    await index_js_1.prisma.room.update({ where: { id: roomId }, data: { status: constants_js_1.RoomStatus.ENDED, endedAt: new Date() } });
    const timer = index_js_2.roomTimers.get(roomId);
    if (timer)
        clearTimeout(timer);
    index_js_2.roomTimers.delete(roomId);
    const interval = index_js_2.leaderboardIntervals.get(roomId);
    if (interval)
        clearInterval(interval);
    index_js_2.leaderboardIntervals.delete(roomId);
}
