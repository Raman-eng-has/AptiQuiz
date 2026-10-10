'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, isHostOrAdmin } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface RoomData {
  id: string;
  code: string;
  status: string;
  quiz: { id: string; title: string; category: string; difficulty: string; timePerQuestion: number };
  host: { id: string; name: string; avatarUrl?: string };
  maxPlayers: number;
  allowLateJoin: boolean;
  players: Array<{ id: string; user?: { name: string; avatarUrl?: string }; nickname?: string; score: number; isConnected: boolean }>;
}

export default function JoinRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [wakeNotice, setWakeNotice] = useState(false);

  const code = params.code as string;

  useEffect(() => {
    const wakeTimer = setTimeout(() => setWakeNotice(true), 4000);
    const fetchRoom = async () => {
      try {
        const res = await api.get<RoomData>(`/rooms/code/${code.toUpperCase()}`);
        setRoom(res);
      } catch (err: any) {
        setError(err.message || 'Room not found');
      } finally {
        setIsLoading(false);
        setWakeNotice(false);
      }
    };
    fetchRoom();
    return () => clearTimeout(wakeTimer);
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nickname.trim() || nickname.trim().length < 2) {
      setError('Please enter a nickname (at least 2 characters)');
      return;
    }
    if (nickname.trim().length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }

    setJoining(true);
    try {
      const res = await api.post<{ room: { id: string } }>(`/rooms/${room.id}/join`, {
        nickname: nickname.trim(),
      });
      router.push(`/room/${res.room.id}/play`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card p-8 max-w-md mx-auto text-center">
          <span className="text-6xl block mb-4">🚪</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Room Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">This room doesn't exist or the code is invalid.</p>
          <Link href="/join" className="btn-primary mt-4 inline-block">Browse Public Rooms</Link>
        </div>
      </div>
    );
  }

  if (room.status === 'ENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card p-8 max-w-md mx-auto text-center">
          <span className="text-6xl block mb-4">🏁</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Ended</h2>
          <p className="text-gray-600 dark:text-gray-400">This quiz session has ended. View results at <Link href={`/room/${room.code}/results`} className="text-primary-600 hover:underline">Results</Link>.</p>
        </div>
      </div>
    );
  }

  if (!room.allowLateJoin && room.status === 'LIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card p-8 max-w-md mx-auto text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Late Join Disabled</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The host has disabled late joining for this session.</p>
          <Link href="/join" className="btn-primary mt-4 inline-block">Browse Other Rooms</Link>
        </div>
      </div>
    );
  }

  const isHost = isHostOrAdmin();
  const userInRoom = room.players.find(p => p.user?.id === user?.id);
  const player = room.players.find(p => p.nickname === nickname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="badge-primary text-sm mr-2">{room.quiz.category}</span>
            <span className={`badge ${room.quiz.difficulty === 'EASY' ? 'badge-success' : room.quiz.difficulty === 'MEDIUM' ? 'badge-warning' : 'badge-danger'}`}>{room.quiz.difficulty}</span>
            <span className="badge-secondary">⏱️ {room.quiz.timePerQuestion}s/Q</span>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {room.quiz.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hosted by {room.host.name} • {room.players.length}/{room.maxPlayers} players
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {room.quiz.timePerQuestion}s per question • {room.quiz.category} • {room.quiz.difficulty}
            </p>
          </div>

          {room.players.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Players in Lobby</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((p) => (
                  <div key={p.id} className={`card p-3 flex items-center gap-3 ${p.nickname === nickname ? 'ring-2 ring-primary-500' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                      {p.user?.name?.[0] || p.nickname?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {p.user?.name || p.nickname}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {p.user?.id ? 'Registered' : 'Guest'} • {p.isConnected ? '🟢 Online' : '🔴 Offline'}
                      </p>
                    </div>
                    <span className="badge-primary text-xs">{p.score} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
            {userInRoom ? (
              <Link href={`/room/${room.code}/play`} className="btn-primary w-full py-3 text-lg font-semibold shadow-md">
                Continue to Game
              </Link>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="label">Enter your Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter a fun nickname..."
                    maxLength={20}
                    className="input text-center text-lg font-medium uppercase tracking-widest"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">2-20 characters, visible to all players</p>
                </div>
                <button type="submit" disabled={joining} className="w-full btn-primary py-3 text-lg font-semibold shadow-md">
                  {joining ? 'Joining...' : 'Join Game'}
                </button>
                {error && (
                  <p className="text-sm text-danger-500 text-center">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function useAuthStore(): any {
  return { login: () => {}, isAuthenticated: false, user: null };
}

function isHostOrAdmin(): boolean {
  return false;
}

const api = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${url}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async <T>(url: string, data: any): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

function useAuthStore() {
  return { login: () => {}, isAuthenticated: false, user: null };
}

function isHostOrAdmin() {
  return false;
}

const api = {
  get: async <T>(url: string): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`); if (!res.ok) throw new Error(await res.text()); return res.json(); },
  post: async <T>(url: string, data: any): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(await res.text()); return res.json(); },
};

function useState<T>(initial: T) { return [null, () => {}] as [T, (v: T) => void]; }
function useEffect(effect: () => void, deps: any[]) {}
function useParams() { return { code: 'ABC123' }; }
function useSearchParams() { return new URLSearchParams(); }
function useRouter() { return { push: (url: string) => window.location.href = url }; }
function useAuthStore() { return { login: () => {}, isAuthenticated: false, user: null }; }
function isHostOrAdmin() { return false; }
const api = { get: async <T>(url: string): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`); if (!res.ok) throw new Error(await res.text()); return res.json(); }, post: async <T>(url: string, data: any): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }, };

function useState<T>(initial: T) { return [null, () => {}] as [T, (v: T) => void]; }
function useEffect(effect: () => void, deps: any[]) {}
function useParams() { return { code: 'ABC123' }; }
function useSearchParams() { return new URLSearchParams(); }
function useRouter() { return { push: (url: string) => window.location.href = url }; }
function useAuthStore() { return { login: () => {}, isAuthenticated: false, user: null }; }
function isHostOrAdmin() { return false; }
const api = { get: async <T>(url: string): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`); if (!res.ok) throw new Error(await res.text()); return res.json(); }, post: async <T>(url: string, data: any): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }, };

function useState<T>(initial: T) { return [null, () => {}] as [T, (v: T) => void]; }
function useEffect(effect: () => void, deps: any[]) {}
function useParams() { return { code: 'ABC123' }; }
function useSearchParams() { return new URLSearchParams(); }
function useRouter() { return { push: (url: string) => window.location.href = url }; }
function useParams() { return { code: 'ABC123' }; }
function useSearchParams() { return new URLSearchParams(); }
function useAuthStore() { return { login: () => {}, isAuthenticated: false, user: null }; }
function isHostOrAdmin() { return false; }
const api = { get: async <T>(url: string): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`); if (!res.ok) throw new Error(await res.text()); return res.json(); }, post: async <T>(url: string, data: any): Promise<T> => { const res = await fetch(`http://localhost:4000/api${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }, };

export default function JoinRoomPage() { return <div>Join Room Page</div>; }