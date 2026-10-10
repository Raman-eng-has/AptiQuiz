"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIntegrityEvent = handleIntegrityEvent;
exports.detectTooFastAnswer = detectTooFastAnswer;
exports.detectIdenticalPatterns = detectIdenticalPatterns;
exports.detectImpossibleAccuracy = detectImpossibleAccuracy;
exports.detectMultipleDevices = detectMultipleDevices;
const index_js_1 = require("../../index.js");
const uuid_1 = require("uuid");
const constants_js_1 = require("../constants.js");
async function handleIntegrityEvent(io, socket, event) {
    try {
        const { roomId, playerId, userId } = socket.data;
        if (!roomId || !playerId)
            return;
        const severityMap = {
            [constants_js_1.IntegrityEventType.FOCUS_LOSS]: 'LOW',
            [constants_js_1.IntegrityEventType.DEVTOOLS_DETECTED]: 'MEDIUM',
            [constants_js_1.IntegrityEventType.TOO_FAST_ANSWER]: 'HIGH',
            [constants_js_1.IntegrityEventType.IDENTICAL_PATTERN]: 'HIGH',
            [constants_js_1.IntegrityEventType.IMPOSSIBLE_ACCURACY]: 'HIGH',
            [constants_js_1.IntegrityEventType.MULTIPLE_DEVICES]: 'MEDIUM',
            [constants_js_1.IntegrityEventType.EXTENSION_MISSING]: 'MEDIUM',
            [constants_js_1.IntegrityEventType.CLIPBOARD_ACCESS]: 'LOW',
            [constants_js_1.IntegrityEventType.TAB_SWITCH]: 'LOW',
        };
        const integrityEvent = await index_js_1.prisma.integrityEvent.create({
            data: {
                id: (0, uuid_1.v4)(),
                roomId,
                playerId,
                type: event.type,
                severity: severityMap[event.type] || 'LOW',
                details: event.details,
                timestamp: new Date(),
            },
        });
        await updateIntegrityScore(playerId);
        io.to(roomId).emit(constants_js_1.SocketEvents.INTEGRITY_EVENT, integrityEvent);
    }
    catch (error) {
        console.error('Integrity event error:', error);
    }
}
async function updateIntegrityScore(playerId) {
    const events = await index_js_1.prisma.integrityEvent.findMany({
        where: { playerId },
        orderBy: { timestamp: 'desc' },
    });
    let score = 100;
    const weights = {
        LOW: -1,
        MEDIUM: -5,
        HIGH: -15,
    };
    for (const event of events) {
        score += weights[event.severity] || 0;
    }
    score = Math.max(0, Math.min(100, score));
    await index_js_1.prisma.roomPlayer.update({
        where: { id: playerId },
        data: { user: { update: { integrityScore: score } } },
    }).catch(() => { });
}
async function detectTooFastAnswer(roomId, playerId, questionId, timeTakenMs) {
    const question = await index_js_1.prisma.question.findUnique({ where: { id: questionId } });
    if (!question)
        return;
    const minReadTime = Math.max(1000, question.text.length * 20);
    if (timeTakenMs < minReadTime) {
        await index_js_1.prisma.integrityEvent.create({
            data: {
                id: (0, uuid_1.v4)(),
                roomId,
                playerId,
                type: constants_js_1.IntegrityEventType.TOO_FAST_ANSWER,
                severity: 'HIGH',
                details: { timeTakenMs, minReadTime, questionLength: question.text.length },
                timestamp: new Date(),
            },
        });
    }
}
async function detectIdenticalPatterns(roomId, playerId, questionIndex, answer, timeTakenMs) {
    const otherAnswers = await index_js_1.prisma.answer.findMany({
        where: { roomId, questionIndex, NOT: { playerId } },
        select: { answer: true, rttMs: true, playerId: true },
    });
    for (const other of otherAnswers) {
        const otherAnswer = JSON.parse(other.answer);
        const timeDiff = Math.abs(timeTakenMs - other.rttMs);
        if (JSON.stringify(answer) === JSON.stringify(otherAnswer) && timeDiff < 100) {
            await index_js_1.prisma.integrityEvent.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    roomId,
                    playerId,
                    type: constants_js_1.IntegrityEventType.IDENTICAL_PATTERN,
                    severity: 'HIGH',
                    details: { otherPlayerId: other.playerId, timeDiff, answer },
                    timestamp: new Date(),
                },
            });
        }
    }
}
async function detectImpossibleAccuracy(playerId, roomId) {
    const answers = await index_js_1.prisma.answer.findMany({ where: { playerId, roomId } });
    if (answers.length < 5)
        return;
    const recentCorrect = answers.slice(-5).filter(a => a.isCorrect).length;
    if (recentCorrect === 5) {
        const allAnswers = await index_js_1.prisma.answer.findMany({ where: { roomId } });
        const avgAccuracy = allAnswers.filter(a => a.isCorrect).length / allAnswers.length;
        if (avgAccuracy < 0.5) {
            await index_js_1.prisma.integrityEvent.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    roomId,
                    playerId,
                    type: constants_js_1.IntegrityEventType.IMPOSSIBLE_ACCURACY,
                    severity: 'HIGH',
                    details: { streak: 5, roomAvgAccuracy: avgAccuracy },
                    timestamp: new Date(),
                },
            });
        }
    }
}
async function detectMultipleDevices(roomId, userId) {
    const existingPlayers = await index_js_1.prisma.roomPlayer.findMany({
        where: { roomId, userId, isConnected: true },
    });
    if (existingPlayers.length > 1) {
        for (const player of existingPlayers.slice(1)) {
            await index_js_1.prisma.integrityEvent.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    roomId,
                    playerId: player.id,
                    type: constants_js_1.IntegrityEventType.MULTIPLE_DEVICES,
                    severity: 'MEDIUM',
                    details: { otherPlayerIds: existingPlayers.filter(p => p.id !== player.id).map(p => p.id) },
                    timestamp: new Date(),
                },
            });
        }
    }
}
