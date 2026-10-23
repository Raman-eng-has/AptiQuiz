'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

function JoinFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const qrCodeParam = searchParams?.get('code');
    if (qrCodeParam) {
      setCode(qrCodeParam.trim().toUpperCase().slice(0, 6));
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanedCode = code.trim().toUpperCase();
    if (cleanedCode.length !== 6) {
      setError('Room code must be exactly 6 characters.');
      return;
    }

    setIsValidating(true);
    try {
      // Pre-validate room status & entry lock before entering lobby
      const res = await api.get<{ room: any }>(`/rooms/code/${cleanedCode}`);
      const room = res.room;

      if (!room) {
        setError('Invalid room code. Please check and try again.');
        setIsValidating(false);
        return;
      }

      if (room.status === 'ENDED') {
        setError('This quiz contest has already ended.');
        setIsValidating(false);
        return;
      }

      // Check if user was already in this room (reconnection allowed)
      const savedRoomSession = sessionStorage.getItem(`aptiquiz_joined_${cleanedCode}`);
      const isRoomHost = user && room.host?.id === user.id;

      // Strict Entry Validation: Once quiz starts (LIVE or PAUSED), no new participant can enter
      if (room.status !== 'WAITING' && !savedRoomSession && !isRoomHost) {
        setError(
          '🔒 Entry Locked: This quiz has already started! New participants cannot join after the host starts the game.'
        );
        setIsValidating(false);
        return;
      }

      if ((room._count?.players || 0) >= (room.maxPlayers || 50) && !savedRoomSession && !isRoomHost) {
        setError('Room is full (maximum 50 players reached).');
        setIsValidating(false);
        return;
      }

      const finalNickname = nickname.trim() || user?.name || 'Player';
      sessionStorage.setItem('aptiquiz_nickname', finalNickname);
      sessionStorage.setItem(`aptiquiz_joined_${cleanedCode}`, 'true');

      router.push(`/room/${cleanedCode}`);
    } catch (err: any) {
      setError(err.message || 'Room not found or unable to join.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDemoJoin = () => {
    setCode('ABC123');
    setNickname('SpeedSolver');
    setError(null);
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-3xl font-bold mb-4">
          🎮
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Join Live Contest
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Scan a quiz QR code or enter your 6-digit room code before the host starts the game.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 text-sm font-medium">
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
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
            <span>🔒</span> Entry automatically locks once the host starts the quiz.
          </p>
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

        <button
          type="submit"
          disabled={isValidating}
          className="w-full btn-primary text-base py-3 font-semibold"
        >
          {isValidating ? 'Validating Room Status...' : 'Enter Contest Lobby'}
        </button>
      </form>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center space-y-2">
        <button
          onClick={handleDemoJoin}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          Use Seeded Demo Code (ABC123)
        </button>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="p-8 text-center">Loading join form...</div>}>
          <JoinFormContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
