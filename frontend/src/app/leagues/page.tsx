'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface SeasonItem {
  id: string;
  name: string;
  college?: { name: string; code: string };
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { scores: number };
}

interface LeagueLeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  rank: number;
  quizzesPlayed: number;
  accuracy: number;
  college?: { name: string };
  branch?: { name: string };
}

export default function LeaguesPage() {
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeagueLeaderboardEntry[]>([]);
  const [scopeTab, setScopeTab] = useState<'OVERALL' | 'COLLEGE' | 'BRANCH'>('OVERALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wakeNotice, setWakeNotice] = useState(false);

  useEffect(() => {
    const wakeTimer = setTimeout(() => {
      if (isLoading) setWakeNotice(true);
    }, 4000);

    async function loadSeasons() {
      try {
        const res = await api.get<{ seasons: SeasonItem[] }>('/leagues');
        if (res.seasons && res.seasons.length > 0) {
          setSeasons(res.seasons);
          setSelectedSeason(res.seasons[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load seasons', err);
        setError(err.message || 'Unable to load tournament leagues');
      } finally {
        setIsLoading(false);
        setWakeNotice(false);
        clearTimeout(wakeTimer);
      }
    }
    loadSeasons();

    return () => clearTimeout(wakeTimer);
  }, []);

  useEffect(() => {
    async function loadSeasonLeaderboard() {
      if (!selectedSeason) return;
      try {
        const res = await api.get<{ leaderboard: LeagueLeaderboardEntry[] }>(
          `/leagues/${selectedSeason}/leaderboard?scope=${scopeTab}`
        );
        setLeaderboard(res.leaderboard || []);
      } catch (err: any) {
        console.error('Failed to load league leaderboard', err);
      }
    }
    loadSeasonLeaderboard();
  }, [selectedSeason, scopeTab]);

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
            Inter-College Tournament Seasons
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            League Seasons & Campus Battles 🏅
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Compete over multi-week seasons for your branch, college, and semester cups.
          </p>
        </div>

        {/* Season Selector & Scope Tabs */}
        <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Season:</span>
            <select
              value={selectedSeason || ''}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="input w-auto text-sm py-1.5 px-3"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? '(Active)' : ''}
                </option>
              ))}
              {seasons.length === 0 && <option value="">No Active Seasons</option>}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(['OVERALL', 'COLLEGE', 'BRANCH'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setScopeTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  scopeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()} League
              </button>
            ))}
          </div>
        </div>

        {/* Standings Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Current League Standings
            </h2>
            <span className="text-xs text-gray-400">
              {leaderboard.length} Ranked Competitors
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading league data...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              No participant scores registered for this season yet. Compete in scheduled quizzes to earn league points!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.userId || idx}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-base w-8 text-gray-400">
                      #{entry.rank || idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {entry.name || 'Student Player'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.college?.name ? `${entry.college.name} • ` : ''}
                        {entry.branch?.name ? `${entry.branch.name} • ` : ''}
                        {entry.quizzesPlayed} contests • {Math.round((entry.accuracy || 0) * 100)}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-base text-primary-600 dark:text-primary-400">
                    {entry.score} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
