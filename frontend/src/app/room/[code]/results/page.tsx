'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface LeaderboardPlayer {
  playerId: string;
  userId?: string;
  name: string;
  score: number;
  rank: number;
  correctCount: number;
  streak: number;
}

export default function RoomResultsPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function loadResults() {
      if (!code) return;
      try {
        const roomData = await api.get<{ room: any }>(`/rooms/code/${code}`);
        setRoom(roomData.room);

        const lbData = await api.get<{ leaderboard: LeaderboardPlayer[] }>(
          `/leaderboard/room/${roomData.room.id}`
        );
        setLeaderboard(lbData.leaderboard || []);
      } catch (err) {
        console.error('Failed to load room results', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [code]);

  const handleShare = () => {
    const text = `I just competed in AptiQuiz room ${code}! Check out the final leaderboard.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Results Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold">
            Contest Concluded
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Final Contest Leaderboard 🏆
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {room?.quiz?.title || 'Aptitude Challenge'} • Room: {code}
          </p>
        </div>

        {/* Podium for Top 3 */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center">
              {top3[1] && (
                <div className="card p-4 w-full text-center space-y-2 border-2 border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
                  <span className="text-3xl">🥈</span>
                  <p className="font-bold text-sm truncate">{top3[1].name}</p>
                  <p className="font-mono text-sm font-bold text-primary-600">
                    {top3[1].score} pts
                  </p>
                </div>
              )}
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center">
              {top3[0] && (
                <div className="card p-5 w-full text-center space-y-2 border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20 shadow-lg scale-105">
                  <span className="text-4xl">👑</span>
                  <p className="font-extrabold text-base truncate">{top3[0].name}</p>
                  <p className="font-mono text-base font-extrabold text-primary-600">
                    {top3[0].score} pts
                  </p>
                </div>
              )}
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center">
              {top3[2] && (
                <div className="card p-4 w-full text-center space-y-2 border-2 border-amber-600 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20">
                  <span className="text-3xl">🥉</span>
                  <p className="font-bold text-sm truncate">{top3[2].name}</p>
                  <p className="font-mono text-sm font-bold text-primary-600">
                    {top3[2].score} pts
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Full Standings ({leaderboard.length})
            </h2>
            <button
              onClick={handleShare}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {isCopied ? 'Copied Link! ✓' : 'Share Results'}
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading standings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">No participants recorded.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.map((player, idx) => (
                <div
                  key={player.playerId || idx}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-base w-6 text-gray-400">
                      #{player.rank || idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {player.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {player.correctCount} Correct • Max Streak: {player.streak}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-base text-primary-600 dark:text-primary-400">
                    {player.score} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/dashboard" className="btn-primary py-2.5 px-6">
            Go to Dashboard
          </Link>
          <Link href="/quiz/explore" className="btn-secondary py-2.5 px-6">
            Play Another Quiz
          </Link>
          <Link href="/rankings" className="btn-outline py-2.5 px-6">
            View Global Rankings
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
