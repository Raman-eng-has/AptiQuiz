'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, isHostOrAdmin } from '@/lib/auth';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface UserStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    rating: number;
    integrityScore: number;
    streak: number;
    longestStreak: number;
    college?: { name: string; code: string };
    branch?: { name: string; code: string };
    _count?: { hostedRooms: number; roomPlayers: number; badges: number };
  };
}

interface DailyChallengeData {
  challenge: {
    id: string;
    date: string;
    quiz: {
      id: string;
      title: string;
      category: string;
      difficulty: string;
      timePerQuestion: number;
    };
  } | null;
  userProgress: { completed: boolean; score: number } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats['user'] | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeData | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [wakeUpNotice, setWakeUpNotice] = useState(false);

  useEffect(() => {
    const wakeTimer = setTimeout(() => {
      if (isLoading) {
        setWakeUpNotice(true);
      }
    }, 4000);

    async function loadData() {
      try {
        const [userData, challengeData] = await Promise.all([
          api.get<UserStats>('/users').catch(() => null),
          api.get<DailyChallengeData>('/leagues/daily-challenge/today').catch(() => null),
        ]);

        if (userData?.user) {
          setStats(userData.user);
        }
        if (challengeData) {
          setDailyChallenge(challengeData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
        setWakeUpNotice(false);
        clearTimeout(wakeTimer);
      }
    }
    loadData();

    return () => clearTimeout(wakeTimer);
  }, []);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    } else {
      router.push('/join');
    }
  };

  const isHost = isHostOrAdmin();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {wakeUpNotice && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                Connecting to cloud server... The Render service may take up to 50 seconds to wake up from idle. Thank you for your patience!
              </span>
            </div>
          )}

          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
                Level: {(stats?.rating || user?.rating || 1200) > 1500 ? 'Master' : (stats?.rating || user?.rating || 1200) > 1300 ? 'Advanced' : 'Novice'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Welcome back, {stats?.name || user?.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {stats?.college?.name ? `${stats.college.name} • ` : ''}
                {stats?.branch?.name ? `${stats.branch.name} • ` : ''}
                Keep your streak going today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isHost && (
                <Link href="/quiz/builder" className="btn-primary text-sm py-2.5 px-4 shadow-sm">
                  + Create Quiz
                </Link>
              )}
              <Link href="/quiz/explore" className="btn-secondary text-sm py-2.5 px-4">
                Explore Quizzes
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.rating ?? user?.rating ?? 1200}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">Elo Skill Score</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-2xl">
                ⚡
              </div>
            </div>

            <div className="card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.streak ?? user?.streak ?? 0} 🔥
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Longest: {stats?.longestStreak ?? user?.longestStreak ?? 0} days
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-2xl">
                🔥
              </div>
            </div>

            <div className="card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Integrity Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.integrityScore ?? user?.integrityScore ?? 100}%
                </p>
                <p className="text-xs text-success-600 dark:text-success-400 mt-1">Fair Play Verified</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center text-success-600 text-2xl">
                🛡️
              </div>
            </div>

            <div className="card p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quizzes Played</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?._count?.roomPlayers ?? 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {stats?._count?.badges ?? 0} Badges Earned
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-2xl">
                🏆
              </div>
            </div>
          </div>

          {/* Quick Actions & Daily Challenge Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Join Room Quick Card */}
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🚪</span> Quick Join Room
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Have a 6-character room code from your instructor or friend?
              </p>
              <form onSubmit={handleJoinByCode} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="input font-mono uppercase tracking-widest text-center text-lg font-bold"
                />
                <button type="submit" className="w-full btn-primary py-2.5">
                  Enter Lobby
                </button>
              </form>
            </div>

            {/* Daily Challenge Card */}
            <div className="card p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> Daily Aptitude Challenge
                </h2>
                <span className="badge-primary">Today</span>
              </div>

              {dailyChallenge?.challenge ? (
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      {dailyChallenge.challenge.quiz.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {dailyChallenge.challenge.quiz.category} • {dailyChallenge.challenge.quiz.difficulty} • {dailyChallenge.challenge.quiz.timePerQuestion}s/question
                    </p>
                  </div>
                  <div>
                    {dailyChallenge.userProgress?.completed ? (
                      <span className="badge-success text-sm py-1 px-3">
                        Completed (Score: {dailyChallenge.userProgress.score})
                      </span>
                    ) : (
                      <Link
                        href={`/quiz/explore?search=${encodeURIComponent(dailyChallenge.challenge.quiz.title)}`}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        Play Challenge
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active daily challenge configured right now. Jump into public practice quizzes!
                  </p>
                  <Link href="/quiz/explore" className="btn-secondary text-xs mt-3 inline-block">
                    Explore Public Quizzes
                  </Link>
                </div>
              )}

              {/* Host Specific Quick Actions */}
              {isHost && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3">
                  <Link href="/quiz/builder" className="btn-outline text-xs py-2 px-3">
                    + New Quiz Set
                  </Link>
                  <Link href="/quiz/explore" className="btn-secondary text-xs py-2 px-3">
                    Host from Quiz Bank
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
