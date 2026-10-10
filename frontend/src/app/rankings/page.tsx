'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface GlobalRankingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  quizzesPlayed: number;
  streak: number;
  longestStreak: number;
  college?: { name: string; code: string };
  branch?: { name: string; code: string };
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<GlobalRankingUser[]>([]);
  const [total, setTotal] = useState(0);
  const [scope, setScope] = useState<'GLOBAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('GLOBAL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const limit = 20;

  const [error, setError] = useState<string | null>(null);
  const [wakeNotice, setWakeNotice] = useState(false);

  useEffect(() => {
    const wakeTimer = setTimeout(() => {
      if (isLoading) setWakeNotice(true);
    }, 4000);

    async function loadRankings() {
      setIsLoading(true);
      setError(null);
      try {
        const offset = (page - 1) * limit;
        const res = await api.get<{ leaderboard: GlobalRankingUser[]; total: number }>(
          `/leaderboard/scope/${scope}?limit=${limit}&offset=${offset}`
        );
        setRankings(res.leaderboard || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        console.error('Failed to load global rankings', err);
        setError(err.message || 'Unable to load rankings');
      } finally {
        setIsLoading(false);
        setWakeNotice(false);
        clearTimeout(wakeTimer);
      }
    }
    loadRankings();

    return () => clearTimeout(wakeTimer);
  }, [scope, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {wakeNotice && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>
              Connecting to cloud server... The Render service may take up to 50 seconds to wake up from idle. Thank you for your patience!
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            Skill Ratings & Placement Ready
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Global Elo Leaderboard 🌟
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Official rankings across all engineering colleges, updated live with each contest.
          </p>
        </div>

        {/* Scope Switcher */}
        <div className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(['GLOBAL', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setScope(tab);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  scope === tab
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {tab === 'GLOBAL' ? 'All-Time Rating' : `${tab.charAt(0) + tab.slice(1).toLowerCase()} Points`}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 font-medium">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
          </span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading leaderboard...</div>
          ) : rankings.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">No ranked players yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {rankings.map((user, idx) => (
                <div
                  key={user.userId || idx}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono font-bold text-base w-8 ${
                        user.rank === 1
                          ? 'text-yellow-500'
                          : user.rank === 2
                          ? 'text-gray-400'
                          : user.rank === 3
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      #{user.rank || (page - 1) * limit + idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 font-bold flex items-center justify-center text-sm">
                      {(user.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.college?.name ? `${user.college.name} • ` : ''}
                        {user.branch?.name ? `${user.branch.name} • ` : ''}
                        Streak: {user.streak || 0} 🔥
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-lg text-primary-600 dark:text-primary-400">
                      {user.score}
                    </p>
                    <p className="text-xs text-gray-400">
                      {scope === 'GLOBAL' ? 'Elo Rating' : 'Points'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
