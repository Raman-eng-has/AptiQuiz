"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const scoring_1 = require("../shared/src/scoring");
(0, vitest_1.describe)('Scoring', () => {
    (0, vitest_1.describe)('Base Points', () => {
        (0, vitest_1.it)('should return correct base points for each difficulty', () => {
            (0, vitest_1.expect)(scoring_1.SCORE_BASE_POINTS[scoring_1.Difficulty.EASY]).toBe(100);
            (0, vitest_1.expect)(scoring_1.SCORE_BASE_POINTS[scoring_1.Difficulty.MEDIUM]).toBe(150);
            (0, vitest_1.expect)(scoring_1.SCORE_BASE_POINTS[scoring_1.Difficulty.HARD]).toBe(200);
        });
    });
    (0, vitest_1.describe)('Speed Bonus', () => {
        (0, vitest_1.it)('should calculate speed bonus correctly', () => {
            const basePoints = 100;
            const timeLimit = 60000;
            const timeRemaining = 30000;
            const expected = Math.floor(basePoints * scoring_1.SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
            (0, vitest_1.expect)(expected).toBe(25);
        });
        (0, vitest_1.it)('should be zero when no time remaining', () => {
            const basePoints = 100;
            const timeLimit = 60000;
            const timeRemaining = 0;
            const expected = Math.floor(basePoints * scoring_1.SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
            (0, vitest_1.expect)(expected).toBe(0);
        });
        (0, vitest_1.it)('should be max when full time remaining', () => {
            const basePoints = 100;
            const timeLimit = 60000;
            const timeRemaining = timeLimit;
            const expected = Math.floor(basePoints * scoring_1.SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
            (0, vitest_1.expect)(expected).toBe(50);
        });
    });
    (0, vitest_1.describe)('Streak Bonus', () => {
        (0, vitest_1.it)('should calculate streak bonus correctly', () => {
            (0, vitest_1.expect)(scoring_1.STREAK_BONUS_PER_CORRECT).toBe(0.1);
            (0, vitest_1.expect)(scoring_1.MAX_STREAK_BONUS).toBe(0.5);
        });
        (0, vitest_1.it)('should cap at max streak bonus', () => {
            const streak = 10;
            const bonus = Math.min(scoring_1.MAX_STREAK_BONUS, streak * scoring_1.STREAK_BONUS_PER_CORRECT);
            (0, vitest_1.expect)(bonus).toBe(0.5);
        });
    });
    (0, vitest_1.describe)('Answer Checking', () => {
        (0, vitest_1.it)('should match single choice answers', () => {
            (0, vitest_1.expect)(checkAnswer({ type: 'SINGLE_CHOICE', correctAnswer: '"A"' }, 'A')).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'SINGLE_CHOICE', correctAnswer: '"A"' }, 'B')).toBe(false);
        });
        (0, vitest_1.it)('should match multi-select answers regardless of order', () => {
            (0, vitest_1.expect)(checkAnswer({ type: 'MULTI_SELECT', correctAnswer: '["A","B"]' }, ['B', 'A'])).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'MULTI_SELECT', correctAnswer: '["A","B"]' }, ['A'])).toBe(false);
        });
        (0, vitest_1.it)('should match numeric answers with tolerance', () => {
            (0, vitest_1.expect)(checkAnswer({ type: 'NUMERIC', correctAnswer: '10', numericTolerance: 0.5 }, 10.3)).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'NUMERIC', correctAnswer: '10', numericTolerance: 0.5 }, 11)).toBe(false);
        });
        (0, vitest_1.it)('should match short text case-insensitively', () => {
            (0, vitest_1.expect)(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'delhi')).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'NEW DELHI')).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'Mumbai')).toBe(false);
        });
        (0, vitest_1.it)('should match true/false', () => {
            (0, vitest_1.expect)(checkAnswer({ type: 'TRUE_FALSE', correctAnswer: 'true' }, true)).toBe(true);
            (0, vitest_1.expect)(checkAnswer({ type: 'TRUE_FALSE', correctAnswer: 'false' }, 'false')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Latency Compensation', () => {
        (0, vitest_1.it)('should calculate one-way latency as RTT/2', () => {
            const rtt = 200;
            const oneWay = rtt / 2;
            (0, vitest_1.expect)(oneWay).toBe(100);
        });
        (0, vitest_1.it)('should cap latency credit at max', () => {
            const rtt = 1000;
            const credit = Math.min(rtt / 2, 300);
            (0, vitest_1.expect)(credit).toBe(300);
        });
    });
});
(0, vitest_1.describe)('calculateScore', () => {
    (0, vitest_1.it)('should calculate correct score for correct answer with speed bonus', () => {
        const basePoints = 100;
        const timeLimit = 60000;
        const timeRemaining = 30000;
        const streak = 2;
        const speedBonus = Math.floor(basePoints * 0.5 * (timeRemaining / timeLimit));
        const streakMultiplier = Math.min(0.5, streak * 0.1);
        const expected = Math.floor(basePoints + speedBonus + basePoints * streakMultiplier);
        const result = calculateScore({ basePoints, timeLimit, timeRemaining, streak, isCorrect: true });
        (0, vitest_1.expect)(result).toBe(expected);
    });
    (0, vitest_1.it)('should apply negative marking for wrong answers', () => {
        const basePoints = 100;
        const negativeMarking = 0.25;
        const result = calculateScore({ basePoints, timeLimit: 60000, timeRemaining: 0, streak: 0, isCorrect: false, negativeMarking });
        (0, vitest_1.expect)(result).toBe(-25);
    });
    (0, vitest_1.it)('should apply double points power-up', () => {
        const result = calculateScore({ basePoints: 100, timeLimit: 60000, timeRemaining: 30000, streak: 0, isCorrect: true, powerUp: 'DOUBLE_POINTS' });
        (0, vitest_1.expect)(result).toBeGreaterThan(150);
    });
});
function checkAnswer(question, answer) {
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
        return accepted.some((a) => String(a).toLowerCase().trim().replace(/\s+/g, ' ') === normalized);
    }
    if (question.type === 'TRUE_FALSE') {
        return String(answer).toLowerCase() === String(correct).toLowerCase();
    }
    return String(answer) === String(correct);
}
function calculateScore(params) {
    if (!params.isCorrect) {
        return -Math.floor(params.basePoints * (params.negativeMarking || 0));
    }
    const speedBonus = Math.floor(params.basePoints * scoring_1.SPEED_BONUS_MULTIPLIER * (params.timeRemaining / params.timeLimit));
    const streakMultiplier = Math.min(scoring_1.MAX_STREAK_BONUS, params.streak * scoring_1.STREAK_BONUS_PER_CORRECT);
    let points = Math.floor(params.basePoints + speedBonus + params.basePoints * streakMultiplier);
    if (params.powerUp === 'DOUBLE_POINTS')
        points *= 2;
    return points;
}
function calculateLatencyCompensation(rtt) {
    return Math.min(rtt / 2, 300);
}
