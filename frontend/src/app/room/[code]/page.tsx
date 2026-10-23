'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { initSocket, joinRoom, socketEvents } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RoomLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();
  const { user, loadFromStorage } = useAuthStore();

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEntryLocked, setIsEntryLocked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    initSocket();

    async function setupLobby() {
      try {
        const roomData = await api.get<{ room: any }>(`/rooms/code/${code}`);
        if (!isMounted) return;
        const fetchedRoom = roomData.room;
        setRoom(fetchedRoom);

        // Generate crisp unique Room QR code pointing to /join?code=CODE
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aptiquiz-phi.vercel.app';
        const joinUrl = `${origin}/join?code=${code}`;
        try {
          const clientQr = await QRCode.toDataURL(joinUrl, {
            width: 300,
            margin: 2,
            color: { dark: '#0284c7', light: '#ffffff' },
          });
          if (isMounted) setQrCodeData(clientQr);
        } catch {
          try {
            const qrRes = await api.get<{ qrCode: string }>(`/rooms/${fetchedRoom.id}/qr`);
            if (isMounted) setQrCodeData(qrRes.qrCode);
          } catch (e) {
            console.warn('QR code generation failed', e);
          }
        }

        const nickname = sessionStorage.getItem('aptiquiz_nickname') || user?.name || 'Player';
        const hasJoinedBefore =
          typeof window !== 'undefined' &&
          sessionStorage.getItem(`aptiquiz_joined_${code}`) === 'true';
        const isRoomHost =
          Boolean(user?.id && (fetchedRoom.hostId === user.id || fetchedRoom.host?.id === user.id));
        const isAlreadyInRoomList =
          Array.isArray(fetchedRoom.players) &&
          fetchedRoom.players.some(
            (p: any) =>
              (user?.id && p.userId === user.id) ||
              (nickname && p.nickname?.toLowerCase() === nickname.toLowerCase())
          );

        // STRICT ENTRY VALIDATION: Once quiz has started, block any new participant from entering
        if (
          fetchedRoom.status &&
          fetchedRoom.status !== 'WAITING' &&
          !hasJoinedBefore &&
          !isRoomHost &&
          !isAlreadyInRoomList
        ) {
          if (isMounted) {
            setIsEntryLocked(true);
            setError(
              fetchedRoom.status === 'FINISHED'
                ? 'This quiz has already ended and is closed to new entries.'
                : '🔒 Entry Locked: This quiz has already started! New participants cannot enter after the host starts the quiz.'
            );
            setIsConnecting(false);
          }
          return;
        }

        // Join room through socket
        const res = await joinRoom({
          code,
          nickname,
          userId: user?.id,
        });

        // Mark player as legitimately joined so mid-game refresh/reconnection is permitted
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`aptiquiz_joined_${code}`, 'true');
        }

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
        if (isMounted) {
          const msg = err.message || 'Failed to connect to room';
          if (msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('already started') || msg.toLowerCase().includes('late')) {
            setIsEntryLocked(true);
          }
          setError(msg);
        }
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
    const link = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : '';
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isHost = room && user && (room.host?.id === user.id || room.hostId === user.id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {error ? (
          <div className="card p-10 sm:p-12 text-center space-y-4 max-w-xl mx-auto border-2 border-danger-200 dark:border-danger-900">
            <span className="text-5xl block">{isEntryLocked ? '🔒' : '⚠️'}</span>
            <h2 className="text-2xl font-extrabold text-danger-600 dark:text-danger-400">
              {isEntryLocked ? 'Quiz Entry Locked' : 'Cannot Enter Room'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{error}</p>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-xs text-gray-500">
              Fair Play Rule: All participants must join the lobby before the host starts Question 1. Late entry after countdown begins is disabled.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/join" className="btn-primary py-2.5 px-6 text-sm">
                Join Another Room
              </Link>
              <Link href="/quiz/explore" className="btn-secondary py-2.5 px-6 text-sm">
                Practice Solo Quizzes
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Lobby Top Banner */}
            <div className="card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-primary">Live Quiz Lobby</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    🟢 Entry Open (Locks When Quiz Starts)
                  </span>
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
                    <span>👥</span> Connected Players ({players.length} / {room?.maxPlayers || 50})
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
                          <p className="text-xs text-emerald-500 font-medium">✓ Verified in Lobby</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QR Code and Quick Join Info */}
              <div className="card p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1">
                  <span className="badge-primary text-xs">Unique Room QR</span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Scan to Join Before Start
                  </h3>
                </div>
                {qrCodeData ? (
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-200">
                    <img
                      src={qrCodeData}
                      alt={`Room ${code} QR Code`}
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    Generating QR...
                  </div>
                )}
                {qrCodeData && (
                  <a
                    href={qrCodeData}
                    download={`aptiquiz-room-${code}-qr.png`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    ⬇️ Download Room QR
                  </a>
                )}
                <p className="text-xs text-gray-500 max-w-xs">
                  Scan with your phone camera or visit <span className="font-mono font-semibold">/join</span> and enter code <strong className="font-mono text-primary-600">{code}</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs w-full">
                  🔒 Note: Once the host starts the quiz, room entry locks automatically.
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
