"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const uuid_1 = require("uuid");
const shared_1 = require("@aptiquiz/shared");
const SERVER_URL = process.env.SOCKET_URL || 'http://localhost:4000';
const ROOM_CODE = process.env.ROOM_CODE || 'ABC123';
const BOT_COUNT = parseInt(process.env.BOT_COUNT || '50', 10);
const QUIZ_DURATION_MS = parseInt(process.env.QUIZ_DURATION_MS || '120000', 10);
const bots = new Map();
const results = [];
function randomLatency() {
    return Math.floor(Math.random() * 750) + 50;
}
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function createBotConfig(index) {
    return {
        roomId: '',
        playerId: '',
        userId: `bot-${index}-${(0, uuid_1.v4)().slice(0, 8)}`,
        latencyMs: randomLatency(),
        answerDelayRange: [500, 8000],
        disconnectProbability: 0.05,
        reconnectDelayRange: [1000, 5000],
    };
}
function connectBot(config) {
    return new Promise((resolve, reject) => {
        const socket = (0, socket_io_client_1.io)(SERVER_URL, {
            auth: { token: `bot-token-${config.userId}` },
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 10000,
        });
        const state = {
            socket,
            connected: false,
            currentQuestionIndex: -1,
            score: 0,
            streak: 0,
            correctCount: 0,
            totalTime: 0,
            powerUpsAvailable: ['DOUBLE_POINTS', 'FIFTY_FIFTY', 'TIME_FREEZE'],
            answers: new Map(),
            events: [],
        };
        bots.set(config.userId, state);
        socket.on('connect', () => {
            state.connected = true;
            state.events.push(`connected at ${Date.now()}`);
            joinRoom(socket, config);
        });
        socket.on('connect_error', (err) => {
            state.events.push(`connection_error: ${err.message}`);
            reject(err);
        });
        socket.on('disconnect', (reason) => {
            state.connected = false;
            state.events.push(`disconnected: ${reason}`);
            if (reason === 'io server disconnect') {
                scheduleReconnect(config);
            }
        });
        socket.on(shared_1.SocketEvents.JOIN_ROOM, (response) => {
            if (response.success) {
                config.roomId = response.roomState?.room?.id || '';
                config.playerId = response.playerId || '';
                state.events.push(`joined room ${config.roomId}`);
                resolve();
            }
            else {
                state.events.push(`join_failed: ${response.error}`);
                reject(new Error(response.error || 'Join failed'));
            }
        });
        socket.on(shared_1.SocketEvents.ROOM_STATE, (roomState) => {
            state.currentQuestionIndex = roomState.questionIndex;
            if (roomState.currentQuestion && roomState.questionIndex >= 0) {
                scheduleAnswer(socket, config, state, roomState);
            }
        });
        socket.on(shared_1.SocketEvents.QUESTION_START, (data) => {
            state.currentQuestionIndex = data.index;
            state.events.push(`question_start:${data.index}`);
            scheduleAnswer(socket, config, state, { questionIndex: data.index, question: data.question });
        });
        socket.on(shared_1.SocketEvents.ROUND_RESULT, (data) => {
            const myResult = data.results.find((r) => r.playerId === config.playerId);
            if (myResult) {
                state.score += myResult.pointsEarned;
                state.streak = myResult.streak;
                state.correctCount += myResult.isCorrect ? 1 : 0;
                state.totalTime += myResult.timeTaken;
                if (myResult.powerUpUsed) {
                    state.powerUpsAvailable = state.powerUpsAvailable.filter(p => p !== myResult.powerUpUsed);
                }
            }
            state.events.push(`round_result:${data.questionIndex} score:${state.score}`);
        });
        socket.on(shared_1.SocketEvents.LEADERBOARD_UPDATE, (leaderboard) => {
            const myEntry = leaderboard.find((e) => e.playerId === config.playerId);
            if (myEntry) {
                state.events.push(`rank:${myEntry.rank}/${leaderboard.length}`);
            }
        });
        socket.on(shared_1.SocketEvents.ERROR, (error) => {
            state.events.push(`error:${error.code}:${error.message}`);
        });
        setTimeout(() => {
            if (!state.connected) {
                reject(new Error('Connection timeout'));
            }
        }, 15000);
    });
}
function joinRoom(socket, config) {
    const joinData = {
        code: ROOM_CODE,
        nickname: `Bot${config.userId.slice(-4)}`,
        userId: config.userId,
    };
    socket.emit(shared_1.SocketEvents.JOIN_ROOM, joinData, () => { });
}
function scheduleAnswer(socket, config, state, questionData) {
    const delay = randomInRange(...config.answerDelayRange);
    const sequenceId = state.answers.size + 1;
    setTimeout(() => {
        if (!state.connected)
            return;
        const question = questionData.question;
        let answer;
        const isCorrect = Math.random() > 0.3;
        if (question?.type === 'MULTI_SELECT') {
            const correctAnswer = JSON.parse(question.correctAnswer);
            if (isCorrect) {
                answer = correctAnswer;
            }
            else {
                const options = question.options;
                const wrongCount = Math.min(2, options.length - 1);
                answer = options.filter((_, i) => !correctAnswer.includes(options[i])).slice(0, wrongCount);
            }
        }
        else if (question?.type === 'NUMERIC') {
            const correct = Number(JSON.parse(question.correctAnswer));
            const tolerance = question.numericTolerance || 0;
            answer = isCorrect ? correct : correct + randomInRange(tolerance + 1, tolerance + 10);
        }
        else if (question?.type === 'SHORT_TEXT') {
            const accepted = question.acceptedAnswers ? JSON.parse(question.acceptedAnswers) : [JSON.parse(question.correctAnswer)];
            answer = isCorrect ? accepted[0] : 'Wrong Answer';
        }
        else if (question?.type === 'TRUE_FALSE') {
            const correct = JSON.parse(question.correctAnswer);
            answer = isCorrect ? correct : !correct;
        }
        else {
            const correct = JSON.parse(question?.correctAnswer || '0');
            const options = question?.options || [];
            answer = isCorrect ? correct : options.find((o) => o !== correct) || 'Wrong';
        }
        const clientSentAt = Date.now() - config.latencyMs;
        const answerData = {
            questionIndex: state.currentQuestionIndex,
            answer,
            clientSentAt,
            sequenceId,
        };
        state.answers.set(state.currentQuestionIndex, { answer, sequenceId, sentAt: clientSentAt });
        socket.emit(shared_1.SocketEvents.SUBMIT_ANSWER, answerData, (response) => {
            state.events.push(`answer:${state.currentQuestionIndex} accepted:${response.accepted}`);
        });
        if (Math.random() < config.disconnectProbability) {
            socket.disconnect();
        }
    }, delay);
}
function scheduleReconnect(config) {
    const delay = randomInRange(...config.reconnectDelayRange);
    setTimeout(() => {
        const state = bots.get(config.userId);
        if (!state || state.connected)
            return;
        state.events.push(`reconnecting after ${delay}ms`);
        connectBot(config).catch(err => {
            state.events.push(`reconnect_failed: ${err.message}`);
        });
    }, delay);
}
async function runSimulation() {
    console.log(`🤖 Starting ${BOT_COUNT}-bot simulation...`);
    console.log(`📡 Server: ${SERVER_URL}`);
    console.log(`🏠 Room: ${ROOM_CODE}`);
    console.log(`⏱️  Duration: ${QUIZ_DURATION_MS}ms\n`);
    const startTime = Date.now();
    const connectionPromises = [];
    for (let i = 0; i < BOT_COUNT; i++) {
        const config = createBotConfig(i);
        connectionPromises.push(connectBot(config));
        await new Promise(r => setTimeout(r, 50));
    }
    const connectedBots = (await Promise.allSettled(connectionPromises))
        .filter(r => r.status === 'fulfilled').length;
    console.log(`✅ ${connectedBots}/${BOT_COUNT} bots connected`);
    if (connectedBots === 0) {
        console.error('❌ No bots connected. Exiting.');
        process.exit(1);
    }
    await new Promise(r => setTimeout(r, QUIZ_DURATION_MS));
    console.log('\n📊 Collecting results...');
    let totalAnswers = 0;
    let totalAccepted = 0;
    let totalRejected = 0;
    let totalDisconnects = 0;
    let totalReconnects = 0;
    let latencies = [];
    for (const [userId, state] of bots) {
        for (const event of state.events) {
            if (event.startsWith('answer:')) {
                totalAnswers++;
                if (event.includes('accepted:true'))
                    totalAccepted++;
                else
                    totalRejected++;
            }
            if (event.startsWith('disconnected'))
                totalDisconnects++;
            if (event.startsWith('reconnecting'))
                totalReconnects++;
        }
        if (state.socket) {
            state.socket.disconnect();
        }
    }
    const duration = Date.now() - startTime;
    console.log('\n========== SIMULATION RESULTS ==========');
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Bots Connected: ${connectedBots}/${BOT_COUNT}`);
    console.log(`Total Answers Sent: ${totalAnswers}`);
    console.log(`Accepted: ${totalAccepted} (${((totalAccepted / totalAnswers) * 100).toFixed(1)}%)`);
    console.log(`Rejected: ${totalRejected} (${((totalRejected / totalAnswers) * 100).toFixed(1)}%)`);
    console.log(`Disconnects: ${totalDisconnects}`);
    console.log(`Reconnects: ${totalReconnects}`);
    console.log(`Reconnect Success Rate: ${totalReconnects > 0 ? ((totalReconnects / (totalDisconnects || 1)) * 100).toFixed(1) : 'N/A'}%`);
    console.log('\n========== SCORING CONSISTENCY ==========');
    let scoringMatches = 0;
    let scoringMismatches = 0;
    for (const [userId, state] of bots) {
        const expectedScore = calculateExpectedScore(state);
        if (expectedScore === state.score) {
            scoringMatches++;
        }
        else {
            scoringMismatches++;
            console.log(`  ❌ ${userId}: expected ${expectedScore}, got ${state.score}`);
        }
    }
    console.log(`Matches: ${scoringMatches}`);
    console.log(`Mismatches: ${scoringMismatches}`);
    if (scoringMismatches === 0) {
        console.log('\n✅ ALL SCORING CONSISTENT!');
    }
    else {
        console.log('\n❌ SCORING MISMATCHES DETECTED!');
    }
    console.log('\n========== LATENCY STATS ==========');
    for (const [userId, state] of bots) {
        latencies.push(config.latencyMs);
    }
    latencies.sort((a, b) => a - b);
    console.log(`p50: ${latencies[Math.floor(latencies.length * 0.5)]}ms`);
    console.log(`p95: ${latencies[Math.floor(latencies.length * 0.95)]}ms`);
    console.log(`p99: ${latencies[Math.floor(latencies.length * 0.99)]}ms`);
    process.exit(scoringMismatches === 0 ? 0 : 1);
}
function calculateExpectedScore(state) {
    let score = 0;
    let streak = 0;
    for (const [qIndex, answerData] of state.answers) {
        const isCorrect = Math.random() > 0.3;
        const basePoints = 150;
        const timeRemaining = Math.max(0, 30000 - randomInRange(500, 8000));
        const speedBonus = Math.floor(basePoints * shared_1.SPEED_BONUS_MULTIPLIER * (timeRemaining / 30000));
        const streakBonus = Math.min(shared_1.MAX_STREAK_BONUS, streak * shared_1.STREAK_BONUS_PER_CORRECT);
        if (isCorrect) {
            let points = Math.floor(basePoints + speedBonus + basePoints * streakBonus);
            streak++;
            score += points;
        }
        else {
            streak = 0;
        }
    }
    return score;
}
runSimulation().catch(console.error);
