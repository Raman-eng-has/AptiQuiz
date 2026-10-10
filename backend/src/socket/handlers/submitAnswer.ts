import { Server, Socket } from 'socket.io';
import { prisma } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { SocketEvents, SubmitAnswerData, SubmitAnswerResponse, Difficulty, SCORE_BASE_POINTS, SPEED_BONUS_MULTIPLIER, STREAK_BONUS_PER_CORRECT, MAX_STREAK_BONUS, LATENCY_CREDIT_MAX_MS, GRACE_WINDOW_MS } from '../constants.js';
import { endQuestion, broadcastLeaderboardUpdate, roomTimers } from '../index.js';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    roomId: string;
    playerId: string;
    role: UserRole;
  };
}

export async function handleSubmitAnswer(
  io: Server,
  socket: AuthenticatedSocket,
  data: SubmitAnswerData,
  callback: (response: SubmitAnswerResponse) => void
) {
  try {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      return callback({ success: false, accepted: false, error: 'Not in a room' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
        players: { where: { id: playerId } },
      },
    });

    if (!room) return callback({ success: false, accepted: false, error: 'Room not found' });
    if (room.status !== 'LIVE') return callback({ success: false, accepted: false, error: 'Quiz not live' });

    const player = room.players[0];
    if (!player) return callback({ success: false, accepted: false, error: 'Player not found' });

    if (data.questionIndex !== room.currentQuestionIndex) {
      return callback({ success: false, accepted: false, error: 'Question index mismatch' });
    }

    const existingAnswer = await prisma.answer.findFirst({
      where: { roomId, playerId, questionIndex: data.questionIndex },
    });
    if (existingAnswer) {
      return callback({ success: false, accepted: false, error: 'Already answered this question' });
    }

    const quizQuestion = room.quiz.questions[data.questionIndex];
    if (!quizQuestion) return callback({ success: false, accepted: false, error: 'Question not found' });

    const question = quizQuestion.question;
    const timeLimit = quizQuestion.timeLimit || question.timeLimit;
    const serverStartTime = room.questionStartTime?.getTime() || 0;
    const serverEndTime = room.questionEndTime?.getTime() || 0;
    const serverReceivedAt = Date.now();

    const isLate = serverReceivedAt > serverEndTime + GRACE_WINDOW_MS;
    if (isLate) {
      await prisma.answer.create({
        data: {
          id: uuidv4(),
          roomId,
          playerId,
          questionId: question.id,
          questionIndex: data.questionIndex,
          answer: JSON.stringify(data.answer),
          submittedAt: new Date(data.clientSentAt),
          serverReceivedAt: new Date(serverReceivedAt),
          rttMs: data.clientSentAt ? serverReceivedAt - data.clientSentAt : 0,
          isCorrect: false,
          pointsEarned: 0,
          powerUpUsed: data.powerUpUsed,
          sequenceId: data.sequenceId,
        },
      });
      return callback({ success: true, accepted: false, error: 'Answer submitted too late' });
    }

    const isCorrect = checkAnswer(question, data.answer);
    const basePoints = SCORE_BASE_POINTS[question.difficulty as Difficulty] || question.points;
    const timeRemaining = Math.max(0, serverEndTime - serverReceivedAt);
    const speedBonus = Math.floor(basePoints * SPEED_BONUS_MULTIPLIER * (timeRemaining / (timeLimit * 1000)));
    const latencyCredit = Math.min(LATENCY_CREDIT_MAX_MS, player.latencyMs / 2);
    const adjustedTimeRemaining = Math.max(0, timeRemaining + latencyCredit);
    const adjustedSpeedBonus = Math.floor(basePoints * SPEED_BONUS_MULTIPLIER * (adjustedTimeRemaining / (timeLimit * 1000)));
    const streakBonus = Math.min(MAX_STREAK_BONUS, player.streak * STREAK_BONUS_PER_CORRECT);
    let pointsEarned = 0;

    if (isCorrect) {
      pointsEarned = Math.floor(basePoints + adjustedSpeedBonus + basePoints * streakBonus);
      if (data.powerUpUsed === 'DOUBLE_POINTS') pointsEarned *= 2;
    } else {
      const negativeMarking = room.quiz.negativeMarking || 0;
      pointsEarned = -Math.floor(basePoints * negativeMarking);
    }

    if (data.powerUpUsed) {
      await prisma.roomPlayer.update({
        where: { id: playerId },
        data: { powerUpsUsed: { push: data.powerUpUsed }, powerUpsAvailable: { set: player.powerUpsAvailable.filter((p: string) => p !== data.powerUpUsed) } },
      });
      await prisma.powerUpUse.create({
        data: { roomId, playerId, questionIndex: data.questionIndex, type: data.powerUpUsed, wasSuccessful: isCorrect },
      });
    }

    const answer = await prisma.answer.create({
      data: {
        id: uuidv4(),
        roomId,
        playerId,
        questionId: question.id,
        questionIndex: data.questionIndex,
        answer: JSON.stringify(data.answer),
        submittedAt: new Date(data.clientSentAt),
        serverReceivedAt: new Date(serverReceivedAt),
        rttMs: data.clientSentAt ? serverReceivedAt - data.clientSentAt : 0,
        isCorrect,
        pointsEarned,
        powerUpUsed: data.powerUpUsed,
        sequenceId: data.sequenceId,
      },
    });

    await prisma.roomPlayer.update({
      where: { id: playerId },
      data: {
        score: { increment: pointsEarned },
        correctCount: { increment: isCorrect ? 1 : 0 },
        streak: isCorrect ? { increment: 1 } : 0,
        totalTime: { increment: serverReceivedAt - serverStartTime },
      },
    });

    io.to(roomId).emit(SocketEvents.ANSWER_RECEIVED, {
      playerId,
      playerName: player.user?.name || player.nickname || 'Unknown',
      hasAnswered: true,
    });

    const allAnswered = await checkAllAnswered(roomId, room.quiz.questions.length);
    if (allAnswered && room.status === 'LIVE') {
      const timer = roomTimers.get(roomId);
      if (timer) clearTimeout(timer);
      await endQuestion(io, roomId, data.questionIndex);
    }

    callback({ success: true, accepted: true });
  } catch (error) {
    console.error('Submit answer error:', error);
    callback({ success: false, accepted: false, error: 'Failed to submit answer' });
  }
}

function checkAnswer(question: any, answer: string | string[] | number): boolean {
  const correct = JSON.parse(question.correctAnswer);
  if (question.type === 'MULTI_SELECT') {
    const ans = Array.isArray(answer) ? [...answer].sort() : [answer].sort();
    const corr = Array.isArray(correct) ? [...correct].sort() : [correct].sort();
    return JSON.stringify(ans) === JSON.stringify(corr);
  }
  if (question.type === 'NUMERIC') {
    const tolerance = question.numericTolerance || 0;
    return Math.abs(Number(answer) - Number(correct)) <= tolerance;
  }
  if (question.type === 'SHORT_TEXT') {
    const accepted = question.acceptedAnswers ? JSON.parse(question.acceptedAnswers) : [correct];
    const normalized = String(answer).toLowerCase().trim().replace(/\s+/g, ' ');
    return accepted.some((a: string) => String(a).toLowerCase().trim().replace(/\s+/g, ' ') === normalized);
  }
  if (question.type === 'TRUE_FALSE') {
    return String(answer).toLowerCase() === String(correct).toLowerCase();
  }
  return String(answer) === String(correct);
}

async function checkAllAnswered(roomId: string, totalQuestions: number): Promise<boolean> {
  const answeredCounts = await prisma.answer.groupBy({
    by: ['playerId'],
    where: { roomId, questionIndex: { lt: totalQuestions } },
    _count: { playerId: true },
  });
  const playerCount = await prisma.roomPlayer.count({ where: { roomId, leftAt: null } });
  return answeredCounts.length === playerCount && answeredCounts.every(c => c._count.playerId > 0);
}
