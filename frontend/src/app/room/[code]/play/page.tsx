'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initSocket, getSocket, submitAnswer, usePowerUp, sendIntegrityEvent, socketEvents, joinRoom } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import { PowerUpType, IntegrityEventType } from '@aptiquiz/shared';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PlayQuizPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();
  const { user, loadFromStorage } = useAuthStore();

  const [question, setQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [totalTimeLimit, setTotalTimeLimit] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Power-ups state
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUpType[]>([
    PowerUpType.DOUBLE_POINTS,
    PowerUpType.FIFTY_FIFTY,
    PowerUpType.TIME_FREEZE,
  ]);
  const [usedPowerUps, setUsedPowerUps] = useState<PowerUpType[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  // Round Results / Explanations
  const [roundResult, setRoundResult] = useState<any>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Sequence and timers
  const sequenceIdRef = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const serverStartTimeRef = useRef(Date.now());

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Anti-cheat client deterrents
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendIntegrityEvent({
          roomId: code,
          playerId: user?.id || 'unknown',
          type: IntegrityEventType.TAB_SWITCH,
          severity: 'LOW',
          details: { timestamp: Date.now(), reason: 'tab_hidden' },
          action: 'NONE',
        });
      }
    };

    const handleFocusLoss = () => {
      sendIntegrityEvent({
        roomId: code,
        playerId: user?.id || 'unknown',
        type: IntegrityEventType.FOCUS_LOSS,
        severity: 'LOW',
        details: { timestamp: Date.now() },
        action: 'NONE',
      });
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      sendIntegrityEvent({
        roomId: code,
        playerId: user?.id || 'unknown',
        type: IntegrityEventType.CLIPBOARD_ACCESS,
        severity: 'LOW',
        details: { action: e.type },
        action: 'NONE',
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusLoss);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [code, user]);

  // Socket setup & real-time events
  useEffect(() => {
    if (!code) return;

    const socket = initSocket();

    socket.on('connect', () => setIsReconnecting(false));
    socket.on('disconnect', () => setIsReconnecting(true));
    socket.on('connect_error', () => setIsReconnecting(true));

    const nickname = sessionStorage.getItem('aptiquiz_nickname') || user?.name || 'Player';
    joinRoom({ code, nickname, userId: user?.id }).then((res) => {
      if (res.roomState) {
        if (res.roomState.status === 'ENDED') {
          router.push(`/room/${code}/results`);
          return;
        }
        if (res.roomState.currentQuestion) {
          setQuestion(res.roomState.currentQuestion);
          setQuestionIndex(res.roomState.questionIndex);
          setTimeRemaining(res.roomState.timeRemaining);
          setTotalTimeLimit(res.roomState.timeRemaining || 60);
        }
      }
    });

    socketEvents.onQuestionStart((data) => {
      setShowRoundResult(false);
      setRoundResult(null);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
      setActivePowerUp(null);
      setHiddenOptions([]);

      setQuestion(data.question);
      setQuestionIndex(data.index);
      setTotalQuestions(data.totalQuestions);
      setTimeRemaining(data.timeLimit);
      setTotalTimeLimit(data.timeLimit);
      serverStartTimeRef.current = data.serverStartTime;
      sequenceIdRef.current += 1;
    });

    socketEvents.onRoundResult((data) => {
      setRoundResult(data);
      setShowRoundResult(true);
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    });

    socketEvents.onLeaderboardUpdate((board) => {
      setLeaderboard(board);
    });

    socketEvents.onRoomState((state) => {
      if (state.status === 'ENDED') {
        router.push(`/room/${code}/results`);
      }
    });

    socketEvents.onPowerUpResult((res) => {
      if (res.type === PowerUpType.FIFTY_FIFTY && (res.effect as any)?.removedOptions) {
        setHiddenOptions((res.effect as any).removedOptions);
      } else if (res.type === PowerUpType.TIME_FREEZE && (res.effect as any)?.extraTime) {
        setTimeRemaining((prev) => prev + 5);
      }
    });

    return () => {
      socketEvents.offAll();
    };
  }, [code, user, router]);

  // Countdown timer synced to seconds
  useEffect(() => {
    if (showRoundResult || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, showRoundResult]);

  const handleSelectAnswer = async (option: string) => {
    if (isAnswerLocked || timeRemaining <= 0) return;

    setSelectedAnswer(option);
    setIsAnswerLocked(true);

    try {
      await submitAnswer({
        questionIndex,
        answer: option,
        clientSentAt: Date.now(),
        sequenceId: sequenceIdRef.current,
        powerUpUsed: activePowerUp || undefined,
      });
    } catch (err) {
      console.error('Failed to submit answer', err);
    }
  };

  const handleActivatePowerUp = async (type: PowerUpType) => {
    if (usedPowerUps.includes(type) || isAnswerLocked) return;

    try {
      await usePowerUp({ questionIndex, type });
      setAvailablePowerUps((prev) => prev.filter((p) => p !== type));
      setUsedPowerUps((prev) => [...prev, type]);
      setActivePowerUp(type);
    } catch (err) {
      console.error('Failed to activate power-up', err);
    }
  };

  const timerPercent = totalTimeLimit > 0 ? (timeRemaining / totalTimeLimit) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none">
      <Navbar />

      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting to game server... Session will restore automatically.</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Game Status Bar */}
        <div className="card p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="badge-primary text-sm px-3 py-1 font-bold">
              Q{questionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              Room: {code}
            </span>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-3">
            <div className="w-32 bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden hidden sm:block">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeRemaining > 15
                    ? 'bg-primary-500'
                    : timeRemaining > 5
                    ? 'bg-amber-500'
                    : 'bg-danger-500'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                timeRemaining <= 5 ? 'text-danger-500 animate-pulse' : 'text-gray-900 dark:text-white'
              }`}
            >
              ⏱️ {timeRemaining}s
            </span>
          </div>
        </div>

        {/* Round Result Overlay / View */}
        {showRoundResult ? (
          <div className="card p-6 sm:p-8 space-y-6 animate-scale-in text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-3xl mb-2">
              📊
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Round Complete!
            </h2>

            {/* Explanation box */}
            {question?.explanation && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-left border border-gray-200 dark:border-gray-700 text-sm space-y-1">
                <span className="font-semibold text-primary-600 block">Solution & Explanation:</span>
                <p className="text-gray-700 dark:text-gray-300">{question.explanation}</p>
              </div>
            )}

            {/* Quick Leaderboard ranking preview */}
            <div className="space-y-3 text-left">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Current Standings
              </h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <div
                    key={entry.playerId || idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      idx === 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm w-5">{idx + 1}.</span>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {entry.playerName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-primary-600">
                      {entry.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 animate-pulse pt-2">
              Next question starting shortly...
            </p>
          </div>
        ) : (
          <>
            {/* Question Card */}
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                  {question?.topic || 'Aptitude'} • {question?.difficulty || 'Medium'}
                </span>
                {activePowerUp && (
                  <span className="badge-warning text-xs font-bold animate-pulse">
                    ⚡ {activePowerUp.replace('_', ' ')} Active!
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {question?.text || 'Loading question...'}
              </h2>

              {/* Shuffled Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {((question?.shuffledOptions || question?.options) || ['Option A', 'Option B', 'Option C', 'Option D']).map(
                  (option: string, idx: number) => {
                    const isHidden = hiddenOptions.includes(idx);
                    const isSelected = selectedAnswer === option;

                    if (isHidden) {
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 opacity-30 text-center text-sm text-gray-400"
                        >
                          Eliminated by 50-50
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={isAnswerLocked || timeRemaining <= 0}
                        className={`option-button flex items-center gap-4 ${
                          isSelected ? 'option-button-selected border-primary-500' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {isAnswerLocked && (
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <span>🔒</span> Answer locked! Waiting for timer or peers...
                </div>
              )}
            </div>

            {/* Power-ups Bar */}
            <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Available Power-ups:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleActivatePowerUp(PowerUpType.DOUBLE_POINTS)}
                  disabled={!availablePowerUps.includes(PowerUpType.DOUBLE_POINTS) || isAnswerLocked}
                  className="btn-secondary text-xs py-2 px-3 font-semibold disabled:opacity-30"
                  title="2x Score on correct answer"
                >
                  ⚡ Double Points
                </button>
                <button
                  onClick={() => handleActivatePowerUp(PowerUpType.FIFTY_FIFTY)}
                  disabled={!availablePowerUps.includes(PowerUpType.FIFTY_FIFTY) || isAnswerLocked}
                  className="btn-secondary text-xs py-2 px-3 font-semibold disabled:opacity-30"
                  title="Remove 2 incorrect options"
                >
                  ✂️ 50-50
                </button>
                <button
                  onClick={() => handleActivatePowerUp(PowerUpType.TIME_FREEZE)}
                  disabled={!availablePowerUps.includes(PowerUpType.TIME_FREEZE) || isAnswerLocked}
                  className="btn-secondary text-xs py-2 px-3 font-semibold disabled:opacity-30"
                  title="+5 Seconds extra time"
                >
                  ❄️ Time Freeze
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
