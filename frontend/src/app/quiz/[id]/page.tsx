'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { useAuthStore, isHostOrAdmin } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface QuestionData {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  topic: string;
  subtopic?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  points: number;
  imageUrl?: string | null;
  tableData?: any;
}

interface QuizQuestionLink {
  id: string;
  order: number;
  timeLimit?: number;
  points?: number;
  question: QuestionData;
}

interface QuizDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timePerQuestion?: number;
  negativeMarking?: number;
  tags: string[];
  creator?: { id: string; name: string };
  questions: QuizQuestionLink[];
}

function parseCorrectAnswer(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : String(parsed);
  } catch {
    return raw.replace(/^"|"$/g, '');
  }
}

export default function QuizPracticeAndDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;
  const { isAuthenticated } = useAuthStore();
  const isHost = isHostOrAdmin();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modes: 'PRACTICE' (interactive step-by-step with instant explanation) | 'STUDY' (all questions & solutions)
  const [mode, setMode] = useState<'PRACTICE' | 'STUDY'>('PRACTICE');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Unique QR Code state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrUrlText, setQrUrlText] = useState<string>('');
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    const fetchQuizDetail = async () => {
      if (!quizId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<{ quiz: QuizDetail }>(`/quizzes/${quizId}`);
        setQuiz(res.quiz);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aptiquiz-phi.vercel.app';
        const url = `${origin}/quiz/${quizId}`;
        setQrUrlText(url);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: { dark: '#0284c7', light: '#ffffff' },
        });
        setQrDataUrl(dataUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizDetail();
  }, [quizId]);

  const handleSelectOption = (qIdx: number, option: string) => {
    if (revealedQuestions[qIdx]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
    setRevealedQuestions((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleHostLiveRoom = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setCreatingRoom(true);
    try {
      const res = await api.post<{ room: { id: string; code: string } }>('/rooms', {
        quizId,
        joinMode: 'ONLINE_LIVE',
      });
      if (res?.room?.code) {
        router.push(`/room/${res.room.code}/host`);
      }
    } catch (err: any) {
      alert(err.message || 'Only HOST or ADMIN accounts can host a live multiplayer room.');
    } finally {
      setCreatingRoom(false);
    }
  };

  const resetPractice = () => {
    setSelectedAnswers({});
    setRevealedQuestions({});
    setCurrentIdx(0);
    setQuizFinished(false);
  };

  const questions = quiz?.questions || [];
  const totalQ = questions.length;
  const currentItem = questions[currentIdx];

  const correctCount = questions.reduce((acc, item, idx) => {
    const chosen = selectedAnswers[idx];
    const correct = parseCorrectAnswer(item.question.correctAnswer);
    return chosen && chosen === correct ? acc + 1 : acc;
  }, 0);

  const attemptedCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/quiz/explore"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            ← Back to Explore Quizzes
          </Link>
          <div className="flex items-center gap-2.5">
            {quiz && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                📱 Unique Quiz QR
              </button>
            )}
            {isHost && quiz && (
              <button
                onClick={handleHostLiveRoom}
                disabled={creatingRoom}
                className="btn-primary text-xs py-2 px-4"
              >
                {creatingRoom ? 'Creating Room...' : '📡 Host Live Room'}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="card p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ) : error || !quiz ? (
          <div className="card p-8 text-center space-y-4">
            <p className="text-danger-600 dark:text-danger-400 font-semibold">
              {error || 'Quiz not found'}
            </p>
            <Link href="/quiz/explore" className="btn-primary inline-block py-2 px-5 text-sm">
              Return to Explore
            </Link>
          </div>
        ) : (
          <>
            {/* Quiz Header Card */}
            <div className="card p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-primary">{quiz.category}</span>
                  <span
                    className={`badge ${
                      quiz.difficulty === 'EASY'
                        ? 'badge-success'
                        : quiz.difficulty === 'MEDIUM'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                  {quiz.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  📝 {totalQ} Questions • ⏱️ {quiz.timePerQuestion || 45}s/Q
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{quiz.description}</p>
              )}

              {/* Mode Switcher */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
                  <button
                    onClick={() => setMode('PRACTICE')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      mode === 'PRACTICE'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    🎯 Interactive Practice Mode
                  </button>
                  <button
                    onClick={() => setMode('STUDY')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      mode === 'STUDY'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    📖 Full Worksheet & Solutions ({totalQ})
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅ Correct: {correctCount} / {attemptedCount}
                  </span>
                  {attemptedCount > 0 && (
                    <button
                      onClick={resetPractice}
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Reset Progress
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MODE 1: INTERACTIVE PRACTICE */}
            {mode === 'PRACTICE' && currentItem && !quizFinished && (
              <div className="card p-6 md:p-8 space-y-6">
                {/* Question Progress Bar */}
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>
                    Question {currentIdx + 1} of {totalQ}
                  </span>
                  <span>
                    Topic: {currentItem.question.topic}
                    {currentItem.question.subtopic ? ` • ${currentItem.question.subtopic}` : ''}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
                  />
                </div>

                {/* Question Text & Optional Image / Table */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 space-y-3">
                  <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white whitespace-pre-line leading-relaxed">
                    Q{currentIdx + 1}. {currentItem.question.text}
                  </p>
                  {currentItem.question.imageUrl && (
                    <div className="pt-2">
                      <img
                        src={currentItem.question.imageUrl}
                        alt={`Question ${currentIdx + 1} visual`}
                        className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 mx-auto object-contain"
                      />
                    </div>
                  )}
                  {currentItem.question.tableData && Array.isArray(currentItem.question.tableData.rows) && (
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-xs md:text-sm border-collapse border border-gray-300 dark:border-gray-700">
                        {Array.isArray(currentItem.question.tableData.headers) && (
                          <thead className="bg-gray-200 dark:bg-gray-800">
                            <tr>
                              {currentItem.question.tableData.headers.map((h: string, hi: number) => (
                                <th key={hi} className="border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-left font-bold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {currentItem.question.tableData.rows.map((row: string[], ri: number) => (
                            <tr key={ri} className="odd:bg-white even:bg-gray-100 dark:odd:bg-gray-900 dark:even:bg-gray-800/60">
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
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3">
                  {currentItem.question.options.map((opt, oIdx) => {
                    const isRevealed = !!revealedQuestions[currentIdx];
                    const chosen = selectedAnswers[currentIdx];
                    const correctAns = parseCorrectAnswer(currentItem.question.correctAnswer);
                    const isCorrectOption = opt === correctAns;
                    const isSelectedOption = opt === chosen;

                    let btnClass =
                      'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-500';
                    if (isRevealed) {
                      if (isCorrectOption) {
                        btnClass =
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30';
                      } else if (isSelectedOption && !isCorrectOption) {
                        btnClass =
                          'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                      } else {
                        btnClass =
                          'border-gray-200 dark:border-gray-800 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(currentIdx, opt)}
                        disabled={isRevealed}
                        className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center justify-between gap-3 ${btnClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-sm md:text-base font-medium">{opt}</span>
                        </div>
                        {isRevealed && isCorrectOption && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isRevealed && isSelectedOption && !isCorrectOption && (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                            ✗ Your Choice
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Step-by-Step Explanation Box */}
                {revealedQuestions[currentIdx] && (
                  <div className="p-5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                        💡 Detailed Solution & Formula Explanation
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Correct Answer: {parseCorrectAnswer(currentItem.question.correctAnswer)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                      {currentItem.question.explanation ||
                        `The correct answer is ${parseCorrectAnswer(currentItem.question.correctAnswer)}.`}
                    </p>
                  </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  {!revealedQuestions[currentIdx] && (
                    <button
                      onClick={() =>
                        setRevealedQuestions((prev) => ({ ...prev, [currentIdx]: true }))
                      }
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Show Answer & Explanation
                    </button>
                  )}

                  {currentIdx < totalQ - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
                      className="btn-primary py-2 px-5 text-sm"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      onClick={() => setQuizFinished(true)}
                      className="btn-primary py-2 px-5 text-sm"
                    >
                      Finish & View Summary 🎉
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Practice Completion Summary */}
            {mode === 'PRACTICE' && quizFinished && (
              <div className="card p-8 text-center space-y-5">
                <div className="text-5xl">🏆</div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Practice Completed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  You scored{' '}
                  <span className="font-extrabold text-primary-600 dark:text-primary-400">
                    {correctCount} / {totalQ}
                  </span>{' '}
                  ({totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0}% accuracy)
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={resetPractice} className="btn-primary py-2.5 px-6 text-sm">
                    Practice Again
                  </button>
                  <button
                    onClick={() => {
                      setQuizFinished(false);
                      setMode('STUDY');
                    }}
                    className="btn-secondary py-2.5 px-6 text-sm"
                  >
                    Review All Solutions
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: FULL WORKSHEET & SOLUTIONS */}
            {mode === 'STUDY' && (
              <div className="space-y-4">
                {questions.map((item, idx) => {
                  const q = item.question;
                  const correctAns = parseCorrectAnswer(q.correctAnswer);
                  return (
                    <div key={item.id || idx} className="card p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          Question {idx + 1} • {q.topic}
                          {q.subtopic ? ` (${q.subtopic})` : ''}
                        </span>
                        <span className="badge-primary">{q.difficulty}</span>
                      </div>

                      <p className="text-base font-bold text-gray-900 dark:text-white whitespace-pre-line">
                        {q.text}
                      </p>

                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt={`Q${idx + 1} illustration`}
                          className="max-h-56 rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                        />
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt === correctAns;
                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 font-bold text-emerald-800 dark:text-emerald-200'
                                  : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span>
                                ({String.fromCharCode(97 + oIdx)}) {opt}
                              </span>
                              {isCorrect && <span>✓ Correct</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-1">
                        <div className="text-xs font-extrabold uppercase text-sky-700 dark:text-sky-300">
                          💡 Step-by-Step Explanation
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {q.explanation || `Correct Answer: ${correctAns}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Unique Quiz QR Code Modal */}
      {showQrModal && quiz && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="card max-w-md w-full p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="badge-primary text-xs">Unique Quiz QR Code</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {quiz.title}
              </h3>
              <p className="text-xs font-mono text-gray-500">Quiz ID: {quiz.id}</p>
            </div>
            {qrDataUrl && (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-gray-200">
                <img src={qrDataUrl} alt="Unique Quiz QR" className="w-56 h-56 mx-auto" />
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Share or project this unique QR code so students can jump directly to this quiz set.
            </p>
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {qrUrlText}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrUrlText);
                  setCopiedQr(true);
                  setTimeout(() => setCopiedQr(false), 2000);
                }}
                className="btn-secondary py-2 px-3 text-xs"
              >
                {copiedQr ? '✓ Link Copied!' : '📋 Copy Link'}
              </button>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`aptiquiz-${quiz.id.slice(0, 8)}-qr.png`}
                  className="btn-primary py-2 px-3 text-xs flex items-center justify-center"
                >
                  ⬇️ Download QR PNG
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
