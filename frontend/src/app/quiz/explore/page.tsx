'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, isHostOrAdmin } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timePerQuestion?: number;
  tags: string[];
  creator?: { id: string; name: string };
  _count?: { questions: number; rooms: number };
}

export default function ExploreQuizzesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creatingRoomQuizId, setCreatingRoomQuizId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [wakeNotice, setWakeNotice] = useState(false);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    setError(null);
    const wakeTimer = setTimeout(() => setWakeNotice(true), 4000);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (searchQuery) params.set('search', searchQuery);

      const [quizRes, catRes] = await Promise.all([
        api.get<{ quizzes: QuizItem[]; total: number }>(`/quizzes?${params.toString()}`),
        api.get<{ categories: { name: string; count: number }[] }>('/quizzes/categories').catch(() => ({ categories: [] })),
      ]);

      setQuizzes(quizRes.quizzes || []);
      if (catRes.categories) {
        setCategories(catRes.categories);
      }
    } catch (err: any) {
      console.error('Failed to fetch quizzes', err);
      setError(err.message || 'Unable to load quizzes. Please try again.');
    } finally {
      setIsLoading(false);
      setWakeNotice(false);
      clearTimeout(wakeTimer);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const handleCreateRoom = async (quizId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setCreatingRoomQuizId(quizId);
    try {
      const res = await api.post<{ room: { id: string; code: string } }>('/rooms', {
        quizId,
        joinMode: 'ONLINE_LIVE',
      });
      if (res?.room?.code) {
        router.push(`/room/${res.room.code}/host`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create room. You must have HOST or ADMIN role.');
    } finally {
      setCreatingRoomQuizId(null);
    }
  };

  const isHost = isHostOrAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Explore Quizzes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Browse public quantitative aptitude, logical reasoning, and verbal practice sets.
            </p>
          </div>
          {isHost && (
            <Link href="/quiz/builder" className="btn-primary py-2.5 px-4 self-start md:self-auto">
              + Build New Quiz
            </Link>
          )}
        </div>

        {wakeNotice && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>
              Connecting to cloud server... The Render service may take up to 50 seconds to wake up from idle. Thank you for your patience!
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchQuizzes} className="btn-secondary text-xs py-1 px-3">
              Retry
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="card p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by quiz title, topic, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary py-2.5 px-6">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Filters:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input text-sm py-1.5 px-3 w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input text-sm py-1.5 px-3 w-auto"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            {(selectedCategory || selectedDifficulty || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedDifficulty('');
                  setSearchQuery('');
                }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Quiz Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="card p-12 text-center space-y-4">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No quizzes found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Try adjusting your search terms or category filters to find available challenges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card-hover p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
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
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                    {quiz.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {quiz.description || 'Comprehensive test questions covering fundamentals and timed practice.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>📝 {quiz._count?.questions ?? 0} Questions</span>
                    <span>⏱️ {quiz.timePerQuestion || 60}s / Q</span>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                  {isHost ? (
                    <button
                      onClick={() => handleCreateRoom(quiz.id)}
                      disabled={creatingRoomQuizId === quiz.id}
                      className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
                    >
                      {creatingRoomQuizId === quiz.id ? 'Creating Room...' : 'Host Room'}
                    </button>
                  ) : (
                    <Link
                      href={`/join`}
                      className="btn-primary w-full text-sm py-2 text-center"
                    >
                      Join Room to Play
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
