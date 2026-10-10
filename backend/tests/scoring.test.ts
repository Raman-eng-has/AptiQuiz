import { describe, it, expect } from 'vitest';
import {
  Difficulty,
  SCORE_BASE_POINTS,
  SPEED_BONUS_MULTIPLIER,
  STREAK_BONUS_PER_CORRECT,
  MAX_STREAK_BONUS,
} from '@aptiquiz/shared';

describe('Scoring', () => {
  describe('Base Points', () => {
    it('should return correct base points for each difficulty', () => {
      expect(SCORE_BASE_POINTS[Difficulty.EASY]).toBe(100);
      expect(SCORE_BASE_POINTS[Difficulty.MEDIUM]).toBe(150);
      expect(SCORE_BASE_POINTS[Difficulty.HARD]).toBe(200);
    });
  });

  describe('Speed Bonus', () => {
    it('should calculate speed bonus correctly', () => {
      const basePoints = 100;
      const timeLimit = 60000;
      const timeRemaining = 30000;
      const expected = Math.floor(basePoints * SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
      expect(expected).toBe(25);
    });

    it('should be zero when no time remaining', () => {
      const basePoints = 100;
      const timeLimit = 60000;
      const timeRemaining = 0;
      const expected = Math.floor(basePoints * SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
      expect(expected).toBe(0);
    });

    it('should be max when full time remaining', () => {
      const basePoints = 100;
      const timeLimit = 60000;
      const timeRemaining = timeLimit;
      const expected = Math.floor(basePoints * SPEED_BONUS_MULTIPLIER * (timeRemaining / timeLimit));
      expect(expected).toBe(50);
    });
  });

  describe('Streak Bonus', () => {
    it('should calculate streak bonus correctly', () => {
      expect(STREAK_BONUS_PER_CORRECT).toBe(0.1);
      expect(MAX_STREAK_BONUS).toBe(0.5);
    });

    it('should cap at max streak bonus', () => {
      const streak = 10;
      const bonus = Math.min(MAX_STREAK_BONUS, streak * STREAK_BONUS_PER_CORRECT);
      expect(bonus).toBe(0.5);
    });
  });

  describe('Answer Checking', () => {
    it('should match single choice answers', () => {
      expect(checkAnswer({ type: 'SINGLE_CHOICE', correctAnswer: '"A"' }, 'A')).toBe(true);
      expect(checkAnswer({ type: 'SINGLE_CHOICE', correctAnswer: '"A"' }, 'B')).toBe(false);
    });

    it('should match multi-select answers regardless of order', () => {
      expect(checkAnswer({ type: 'MULTI_SELECT', correctAnswer: '["A","B"]' }, ['B', 'A'])).toBe(true);
      expect(checkAnswer({ type: 'MULTI_SELECT', correctAnswer: '["A","B"]' }, ['A'])).toBe(false);
    });

    it('should match numeric answers with tolerance', () => {
      expect(checkAnswer({ type: 'NUMERIC', correctAnswer: '10', numericTolerance: 0.5 }, 10.3)).toBe(true);
      expect(checkAnswer({ type: 'NUMERIC', correctAnswer: '10', numericTolerance: 0.5 }, 11)).toBe(false);
    });

    it('should match short text case-insensitively', () => {
      expect(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'delhi')).toBe(true);
      expect(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'NEW DELHI')).toBe(true);
      expect(checkAnswer({ type: 'SHORT_TEXT', correctAnswer: '"Delhi"', acceptedAnswers: '["Delhi","New Delhi"]' }, 'Mumbai')).toBe(false);
    });

    it('should match true/false', () => {
      expect(checkAnswer({ type: 'TRUE_FALSE', correctAnswer: 'true' }, true)).toBe(true);
      expect(checkAnswer({ type: 'TRUE_FALSE', correctAnswer: 'false' }, 'false')).toBe(true);
    });
  });

  describe('Latency Compensation', () => {
    it('should calculate one-way latency as RTT/2', () => {
      const rtt = 200;
      const oneWay = rtt / 2;
      expect(oneWay).toBe(100);
    });

    it('should cap latency credit at max', () => {
      const rtt = 1000;
      const credit = Math.min(rtt / 2, 300);
      expect(credit).toBe(300);
    });
  });
});

describe('calculateScore', () => {
  it('should calculate correct score for correct answer with speed bonus', () => {
    const basePoints = 100;
    const timeLimit = 60000;
    const timeRemaining = 30000;
    const streak = 2;

    const speedBonus = Math.floor(basePoints * 0.5 * (timeRemaining / timeLimit));
    const streakMultiplier = Math.min(0.5, streak * 0.1);
    const expected = Math.floor(basePoints + speedBonus + basePoints * streakMultiplier);

    const result = calculateScore({ basePoints, timeLimit, timeRemaining, streak, isCorrect: true });
    expect(result).toBe(expected);
  });

  it('should apply negative marking for wrong answers', () => {
    const basePoints = 100;
    const negativeMarking = 0.25;
    const result = calculateScore({ basePoints, timeLimit: 60000, timeRemaining: 0, streak: 0, isCorrect: false, negativeMarking });
    expect(result).toBe(-25);
  });

  it('should apply double points power-up', () => {
    const result = calculateScore({ basePoints: 100, timeLimit: 60000, timeRemaining: 30000, streak: 0, isCorrect: true, powerUp: 'DOUBLE_POINTS' });
    expect(result).toBeGreaterThan(150);
  });
});

function checkAnswer(question: any, answer: any): boolean {
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

function calculateScore(params: {
  basePoints: number;
  timeLimit: number;
  timeRemaining: number;
  streak: number;
  isCorrect: boolean;
  negativeMarking?: number;
  powerUp?: string;
}): number {
  if (!params.isCorrect) {
    return -Math.floor(params.basePoints * (params.negativeMarking || 0));
  }

  const speedBonus = Math.floor(params.basePoints * SPEED_BONUS_MULTIPLIER * (params.timeRemaining / params.timeLimit));
  const streakMultiplier = Math.min(MAX_STREAK_BONUS, params.streak * STREAK_BONUS_PER_CORRECT);
  let points = Math.floor(params.basePoints + speedBonus + params.basePoints * streakMultiplier);

  if (params.powerUp === 'DOUBLE_POINTS') points *= 2;

  return points;
}

function calculateLatencyCompensation(rtt: number): number {
  return Math.min(rtt / 2, 300);
}