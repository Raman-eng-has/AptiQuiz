'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { initSocket, getSocket, joinRoom, socketEvents } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RoomLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    const socket = initSocket();

    async function setupLobby() {
      try {
        const roomData = await api.get<{ room: any }>(`/rooms/code/${code}`);
        if (!isMounted) return;
        setRoom(roomData.room);

        // Fetch QR code
        try {
          const qrRes = await api.get<{ qrCode: string }>(`/rooms/${roomData.room.id}/qr`);
          if (isMounted) setQrCodeData(qrRes.qrCode);
        } catch (e) {
          console.warn('QR code generation failed', e);
        }

        const nickname = sessionStorage.getItem('aptiquiz_nickname') || user?.name || 'Player';

        // Join room through socket
        const res = await joinRoom({
          code,
          nickname,
          userId: user?.id,
        });

        if (res.roomState) {
          if (res.roomState.status === 'LIVE') {
            router.push(`/room/${code}/play`);
            return;
          }
          if (res.roomState.players) {
            setPlayers(res.roomState.players);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to connect to room');
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    }

    setupLobby();

    // Socket Event listeners
    socketEvents.onPlayerJoined((player) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === player.id)) return prev;
        return [...prev, player];
      });
    });

    socketEvents.onPlayerLeft((playerId) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    socketEvents.onRoomState((state) => {
      if (state.status === 'LIVE') {
        router.push(`/room/${code}/play`);
      }
      if (state.players) {
        setPlayers(state.players);
      }
    });

    socketEvents.onQuestionStart(() => {
      router.push(`/room/${code}/play`);
    });

    return () => {
      isMounted = false;
      socketEvents.offAll();
    };
  }, [code, user, router]);

  const copyJoinLink = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : '';
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isHost = room && user && room.host?.id === user.id;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {error ? (
          <div className="card p-12 text-center space-y-4">
            <span className="text-4xl block">⚠️</span>
            <h2 className="text-xl font-bold text-danger-600">{error}</h2>
            <p className="text-sm text-gray-500">Please check your code and try again.</p>
            <Link href="/join" className="btn-primary py-2 px-6 inline-block mt-4">
              Return to Join Page
            </Link>
          </div>
        ) : (
          <>
            {/* Lobby Top Banner */}
            <div className="card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="badge-primary">Live Quiz Lobby</span>
                  <span className="text-xs text-gray-400">Waiting for players</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {room?.quiz?.title || 'Live Aptitude Contest'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Host: {room?.host?.name || 'Quiz Master'} • Category: {room?.quiz?.category || 'Aptitude'}
                </p>
              </div>

              {/* Join Code Callout */}
              <div className="text-center md:text-right space-y-2">
                <div className="inline-block p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 text-center">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    Room Code
                  </p>
                  <p className="text-4xl font-mono font-black text-gray-900 dark:text-white tracking-widest mt-1">
                    {code}
                  </p>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <button
                    onClick={copyJoinLink}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    {isCopied ? 'Link Copied! ✓' : 'Copy Join Link'}
                  </button>
                  {isHost && (
                    <Link
                      href={`/room/${code}/host`}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Host Console
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid: Players and QR Code */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Connected Players List */}
              <div className="lg:col-span-2 card p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>👥</span> Connected Players ({players.length})
                  </h2>
                  <span className="flex items-center gap-1.5 text-xs text-success-500 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>

                {isConnecting ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Connecting to server socket...</p>
                  </div>
                ) : players.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No players joined yet. Be the first to join!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {players.map((player, idx) => (
                      <div
                        key={player.id || idx}
                        className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 flex items-center gap-3 shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 font-bold flex items-center justify-center text-sm">
                          {(player.user?.name || player.nickname || 'P')[0].toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {player.user?.name || player.nickname || 'Player'}
                          </p>
                          <p className="text-xs text-gray-400">Ready</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QR Code and Quick Join Info */}
              <div className="card p-6 flex flex-col items-center justify-center text-center space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Scan to Join on Mobile
                </h3>
                {qrCodeData ? (
                  <div className="p-3 bg-white rounded-xl shadow-inner border">
                    <img
                      src={qrCodeData}
                      alt="Room QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    QR Code Ready
                  </div>
                )}
                <p className="text-xs text-gray-500 max-w-xs">
                  Scan with your phone camera or visit <span className="font-mono font-semibold">/join</span> and enter code <strong className="font-mono text-primary-600">{code}</strong>.
                </p>
                <div className="pt-2 w-full">
                  <p className="text-xs text-gray-400 animate-pulse">
                    Waiting for the host to start the round...
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
