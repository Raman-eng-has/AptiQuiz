"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePowerUpUse = handlePowerUpUse;
const index_js_1 = require("../../index.js");
const constants_js_1 = require("../constants.js");
async function handlePowerUpUse(io, socket, data, callback) {
    try {
        const { roomId, playerId } = socket.data;
        if (!roomId || !playerId) {
            return callback({ success: false, error: 'Not in a room' });
        }
        const room = await index_js_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { quiz: true, players: { where: { id: playerId } } },
        });
        if (!room)
            return callback({ success: false, error: 'Room not found' });
        if (!room.quiz.enablePowerUps)
            return callback({ success: false, error: 'Power-ups disabled' });
        if (room.status !== 'LIVE')
            return callback({ success: false, error: 'Quiz not live' });
        const player = room.players[0];
        if (!player)
            return callback({ success: false, error: 'Player not found' });
        if (!player.powerUpsAvailable.includes(data.type)) {
            return callback({ success: false, error: 'Power-up not available' });
        }
        if (data.type === constants_js_1.PowerUpType.TIME_FREEZE && data.questionIndex === (room.quiz?.questions?.length ?? 0) - 1) {
            return callback({ success: false, error: 'Cannot use Time Freeze on last question' });
        }
        await index_js_1.prisma.roomPlayer.update({
            where: { id: playerId },
            data: { powerUpsUsed: { push: data.type }, powerUpsAvailable: { set: player.powerUpsAvailable.filter((p) => p !== data.type) } },
        });
        await index_js_1.prisma.powerUpUse.create({
            data: { roomId, playerId, questionIndex: data.questionIndex, type: data.type, wasSuccessful: true },
        });
        let effect = {};
        if (data.type === constants_js_1.PowerUpType.FIFTY_FIFTY) {
            const question = room.quiz?.questions?.[data.questionIndex]?.question;
            if (question && question.options.length > 2) {
                const correctIndex = question.options.findIndex((opt) => opt === JSON.parse(question.correctAnswer));
                const wrongIndices = question.options.map((_, i) => i).filter(i => i !== correctIndex);
                const removeCount = Math.min(2, wrongIndices.length);
                const toRemove = wrongIndices.sort(() => Math.random() - 0.5).slice(0, removeCount);
                effect = { removedOptions: toRemove };
            }
        }
        else if (data.type === constants_js_1.PowerUpType.TIME_FREEZE) {
            effect = { extraTime: 5000 };
        }
        else if (data.type === constants_js_1.PowerUpType.DOUBLE_POINTS) {
            effect = { multiplier: 2 };
        }
        const result = {
            playerId,
            type: data.type,
            success: true,
            effect,
        };
        io.to(roomId).emit(constants_js_1.SocketEvents.POWER_UP_RESULT, result);
        callback({ success: true });
    }
    catch (error) {
        console.error('Power-up error:', error);
        callback({ success: false, error: 'Failed to use power-up' });
    }
}
