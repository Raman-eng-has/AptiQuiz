"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePing = handlePing;
exports.handleSyncTime = handleSyncTime;
const index_js_1 = require("../../index.js");
const constants_js_1 = require("../constants.js");
async function handlePing(socket, clientTime, callback) {
    const serverTime = Date.now();
    const rtt = serverTime - clientTime;
    const latency = Math.floor(rtt / 2);
    if (socket.data.playerId) {
        await index_js_1.prisma.roomPlayer.update({
            where: { id: socket.data.playerId },
            data: { latencyMs: latency, lastPingAt: new Date() },
        });
    }
    callback(serverTime);
}
async function handleSyncTime(socket) {
    const serverTime = Date.now();
    socket.emit(constants_js_1.SocketEvents.SYNC_TIME, serverTime, 0);
}
