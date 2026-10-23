'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { initSocket, submitAnswer, usePowerUp, sendIntegrityEvent, socketEvents, joinRoom } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import { PowerUpType, IntegrityEventType } from '@aptiquiz/shared';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const OPTION_SHAPES = ['▲', '◆', '●', '■'];

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
  const [entryError, setEntryError] = useState<string | null>(null);

  // Accessibility & UI Controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [showScoringRules, setShowScoringRules] = useState(false);

  // Power-ups state
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUpType[]>([
    PowerUpType.DOUBLE_POINTS,
    PowerUpType.FIFTY_FIFTY,
    PowerUpType.TIME_FREEZE,
  ]);
  const [usedPowerUps, setUsedPowerUps] = useState<PowerUpType[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  // Round Results / Explanations & Rank Movement
  const [roundResult, setRoundResult] = useState<any>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const prevRanksRef = useRef<Record<string, number>>({});
  const [rankDeltas, setRankDeltas] = useState<Record<string, number>>({});

  // Sequence and timers
  const sequenceIdRef = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const serverStartTimeRef = useRef(Date.now());

  // Lightweight Web Audio synth for zero-bandwidth sound effects
  const playTone = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close().catch(() => {});
      }, durationMs);
    } catch {}
  };

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
    joinRoom({ code, nickname, userId: user?.id })
      .then((res) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`aptiquiz_joined_${code}`, 'true');
        }
        if (res.roomState) {
          const st = String(res.roomState.status);
          if (st === 'ENDED' || st === 'FINISHED') {
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
      })
      .catch((err: any) => {
        setEntryError(
          err.message ||
            '🔒 Entry Locked: This quiz has already started. New participants cannot enter mid-game.'
        );
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
      playTone(520, 120, 'triangle');
    });

    socketEvents.onRoundResult((data) => {
      setRoundResult(data);
      setShowRoundResult(true);
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        const deltas: Record<string, number> = {};
        const nextRanks: Record<string, number> = {};
        data.leaderboard.forEach((entry: any, idx: number) => {
          const pid = entry.playerId || entry.playerName || String(idx);
          const currentRank = entry.rank || idx + 1;
          nextRanks[pid] = currentRank;
          if (prevRanksRef.current[pid] !== undefined) {
            deltas[pid] = prevRanksRef.current[pid] - currentRank; // positive = climbed up
          } else {
            deltas[pid] = 0;
          }
        });
        prevRanksRef.current = nextRanks;
        setRankDeltas(deltas);
        setLeaderboard(data.leaderboard);
      }
      playTone(660, 180, 'sine');
    });

    socketEvents.onLeaderboardUpdate((board) => {
      setLeaderboard(board);
    });

    socketEvents.onRoomState((state) => {
      const st = String(state.status);
      if (st === 'ENDED' || st === 'FINISHED') {
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
        if (prev <= 6) {
          playTone(440, 60, 'square');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, showRoundResult, soundEnabled]);

  const handleSelectAnswer = async (option: string) => {
    if (isAnswerLocked || timeRemaining <= 0) return;

    setSelectedAnswer(option);
    setIsAnswerLocked(true);
    playTone(587, 90, 'sine');

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
      playTone(784, 140, 'triangle');
    } catch (err) {
      console.error('Failed to activate power-up', err);
    }
  };

  const timerPercent = totalTimeLimit > 0 ? (timeRemaining / totalTimeLimit) * 100 : 0;

  if (entryError) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex items-center justify-center">
          <div className="card p-10 text-center space-y-4 border-2 border-danger-300 dark:border-danger-800">
            <span className="text-5xl block">🔒</span>
            <h1 className="text-2xl font-extrabold text-danger-600 dark:text-danger-400">
              Entry Locked — Quiz Already in Progress
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {entryError}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/join" className="btn-primary py-2.5 px-5 text-sm">
                Join Another Room
              </Link>
              <Link href="/quiz/explore" className="btn-secondary py-2.5 px-5 text-sm">
                Explore Solo Quizzes
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 select-none">
      <Navbar />

      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting to game server... Your score, streak, and timer will restore automatically.</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Top Game Status Bar + Accessibility & Scoring Controls */}
        <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-primary text-sm px-3 py-1 font-bold">
              Q{questionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              Room: {code}
            </span>
            <button
              type="button"
              onClick={() => setShowScoringRules((v) => !v)}
              className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold hover:bg-sky-100 transition"
            >
              ⚖️ Scoring Rules
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
              title="Toggle sound effects"
            >
              {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
            </button>
            <button
              type="button"
              onClick={() => setLargeText((l) => !l)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                largeText
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              title="Toggle accessible large text"
            >
              🔤 {largeText ? 'Large Text ON' : 'Large Text'}
            </button>
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

        {/* Collapsible Visible Scoring & Latency Fairness Rules */}
        {showScoringRules && (
          <div className="card p-4 sm:p-5 bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                ⚖️ Official AptiQuiz Scoring & Network Fairness Rules
              </span>
              <button
                onClick={() => setShowScoringRules(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold"
              >
                ✕ Hide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
              <div>
                • <strong>Base Points:</strong> Easy = <code className="font-mono">100</code>, Medium = <code className="font-mono">150</code>, Hard = <code className="font-mono">200</code> pts.
                <br />• <strong>Speed Bonus (up to +50%):</strong> <code className="font-mono">+base × 0.5 × (1 - effectiveTime / timeLimit)</code>.
              </div>
              <div>
                • <strong>Streak Bonus:</strong> <code className="font-mono">+10%</code> per consecutive correct answer (capped at <code className="font-mono">+50%</code>).
                <br />• <strong>Fair Under Network Delay:</strong> Server credits <code className="font-mono">RTT/2</code> (up to 300ms) + 500ms grace window. Wrong answer = 0 pts (or negative marking if set) & resets streak.
              </div>
            </div>
          </div>
        )}

        {/* Round Result Overlay / View */}
        {showRoundResult ? (
          <div className="card p-6 sm:p-8 space-y-6 animate-scale-in text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-3xl mb-1">
              📊
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Round {questionIndex + 1} Complete!
            </h2>

            {/* Revealed Correct Answer Banner */}
            {(roundResult?.correctAnswer || question?.correctAnswer) && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-left flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-300 block">
                    ✓ Official Correct Answer
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100">
                    {String(roundResult?.correctAnswer || question?.correctAnswer).replace(/^"|"$/g, '')}
                  </span>
                </div>
                {selectedAnswer && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedAnswer ===
                      String(roundResult?.correctAnswer || question?.correctAnswer).replace(/^"|"$/g, '')
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    Your Choice: {selectedAnswer}
                  </span>
                )}
              </div>
            )}

            {/* Explanation box */}
            {(roundResult?.explanation || question?.explanation) && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-left border border-sky-200 dark:border-sky-800 text-sm space-y-1">
                <span className="font-extrabold text-sky-700 dark:text-sky-300 block">
                  💡 Step-by-Step Solution & Explanation:
                </span>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {roundResult?.explanation || question?.explanation}
                </p>
              </div>
            )}

            {/* Live Leaderboard with Rank Movement Arrows */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  🏆 Live Standings & Rank Movement
                </h3>
                <span className="text-xs text-gray-400">▲ Climbed • ▼ Dropped</span>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 8).map((entry, idx) => {
                  const pid = entry.playerId || entry.playerName || String(idx);
                  const delta = rankDeltas[pid] ?? entry.rankDelta ?? 0;
                  return (
                    <div
                      key={pid}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        idx === 0
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm w-6 text-gray-500">
                          #{entry.rank || idx + 1}
                        </span>
                        {/* Rank movement badge */}
                        {delta > 0 ? (
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                            ▲ +{delta}
                          </span>
                        ) : delta < 0 ? (
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
                            ▼ {delta}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 px-1.5 py-0.5">
                            ●
                          </span>
                        )}
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {entry.playerName || entry.name}
                        </span>
                        {entry.streak > 1 && (
                          <span className="text-xs font-bold text-amber-500">
                            🔥 {entry.streak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {entry.roundScore > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            +{entry.roundScore}
                          </span>
                        )}
                        <span className="font-mono font-extrabold text-sm text-primary-600 dark:text-primary-400">
                          {entry.score} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-gray-400 animate-pulse pt-2">
              Synchronizing next question with server referee...
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

              <h2
                className={`${
                  largeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                } font-bold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line`}
              >
                {question?.text || 'Waiting for next question from server...'}
              </h2>

              {/* Optional Question Image or Data Interpretation Table */}
              {question?.imageUrl && (
                <div className="pt-2">
                  <img
                    src={question.imageUrl}
                    alt="Question diagram"
                    className="max-h-64 rounded-xl border border-gray-200 dark:border-gray-700 mx-auto object-contain"
                  />
                </div>
              )}

              {question?.tableData && Array.isArray(question.tableData.rows) && (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs sm:text-sm border-collapse border border-gray-300 dark:border-gray-700">
                    {Array.isArray(question.tableData.headers) && (
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          {question.tableData.headers.map((h: string, hi: number) => (
                            <th key={hi} className="border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-left font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {question.tableData.rows.map((row: string[], ri: number) => (
                        <tr key={ri} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/50">
                          {row.map((cell: string, ci: number) => (
                            <td key={ci} className="border border-gray-300 dark:border-gray-700 px-3 py-1.5">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Shuffled Options with Color-Blind-Safe Shapes */}
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
                          ✂️ Eliminated by 50-50
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
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{OPTION_SHAPES[idx % 4]}</span>
                          <span className="ml-0.5">{String.fromCharCode(65 + idx)}</span>
                        </div>
                        <span
                          className={`${
                            largeText ? 'text-lg sm:text-xl' : 'text-base'
                          } font-medium text-gray-900 dark:text-white text-left`}
                        >
                          {option}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {isAnswerLocked && (
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <span>🔒</span> Answer locked! Waiting for timer or remaining players...
                </div>
              )}
            </div>

            {/* Power-ups Bar */}
            <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Strategic Power-ups (1 per match):
              </span>
              <div className="flex flex-wrap items-center gap-3">
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
                  ❄️ Time Freeze (+5s)
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
