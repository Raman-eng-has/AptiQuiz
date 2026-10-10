'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanedCode = code.trim().toUpperCase();
    if (cleanedCode.length !== 6) {
      setError('Room code must be exactly 6 characters.');
      return;
    }
    if (nickname.trim()) {
      sessionStorage.setItem('aptiquiz_nickname', nickname.trim());
    }
    router.push(`/room/${cleanedCode}`);
  };

  const handleDemoJoin = () => {
    setCode('ABC123');
    setNickname('DemoPlayer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-3xl font-bold mb-4">
              🎮
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Join Live Contest
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your room code and display name to connect to the game.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="label" htmlFor="roomCode">
                6-Digit Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="input font-mono text-center tracking-widest text-2xl font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="nickname">
                Nickname / Display Name
              </label>
              <input
                id="nickname"
                type="text"
                maxLength={30}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. SpeedSolver"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">
                If signed in, your account name will be used automatically.
              </p>
            </div>

            <button type="submit" className="w-full btn-primary text-base py-3 font-semibold">
              Enter Contest Lobby
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <button
              onClick={handleDemoJoin}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Use Seeded Demo Code (ABC123)
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
