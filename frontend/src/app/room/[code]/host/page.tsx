'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { initSocket, hostControl, socketEvents, joinRoom } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HostControlPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();
  const { user } = useAuthStore();

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('WAITING');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [integrityFlags, setIntegrityFlags] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    const socket = initSocket();

    async function loadRoomDetails() {
      try {
        const res = await api.get<{ room: any }>(`/rooms/code/${code}`);
        if (!isMounted) return;
        setRoom(res.room);
        setStatus(res.room.status);

        // Fetch QR
        try {
          const qrRes = await api.get<{ qrCode: string }>(`/rooms/${res.room.id}/qr`);
          if (isMounted) setQrCodeData(qrRes.qrCode);
        } catch (e) {}

        const joinRes = await joinRoom({
          code,
          userId: user?.id,
          nickname: user?.name || 'Host',
        });
        if (joinRes.roomState?.players && isMounted) {
          setPlayers(joinRes.roomState.players);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load host console');
      }
    }

    loadRoomDetails();

    socketEvents.onPlayerJoined((p) => {
      setPlayers((prev) => [...prev.filter((item) => item.id !== p.id), p]);
    });

    socketEvents.onPlayerLeft((pId) => {
      setPlayers((prev) => prev.map((p) => (p.id === pId ? { ...p, isConnected: false } : p)));
    });

    socketEvents.onRoomState((st) => {
      setStatus(st.status);
      setCurrentQuestionIndex(st.questionIndex);
      if (st.players) setPlayers(st.players);
    });

    socketEvents.onIntegrityEvent((evt) => {
      setIntegrityFlags((prev) => [evt, ...prev]);
    });

    return () => {
      isMounted = false;
      socketEvents.offAll();
    };
  }, [code, user]);

  const handleStartRoom = async () => {
    if (!room) return;
    try {
      await api.post(`/rooms/${room.id}/start`, {});
      setStatus('LIVE');
    } catch (err: any) {
      alert(err.message || 'Failed to start quiz');
    }
  };

  const handlePause = () => hostControl({ type: 'pause' });
  const handleResume = () => hostControl({ type: 'resume' });
  const handleNext = () => hostControl({ type: 'skip' });
  const handleEnd = () => {
    hostControl({ type: 'end' });
    router.push(`/room/${code}/results`);
  };
  const handleExtend = () => hostControl({ type: 'extend', payload: { additionalSeconds: 30 } });

  const handleExportCSV = async () => {
    if (!room) return;
    setIsExporting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/analytics/room/${room.id}/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room-${code}-results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Host Console Header */}
        <div className="card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-primary-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-primary">Host Live Console</span>
              <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                Status: {status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Room Controls: <span className="font-mono text-primary-600">{code}</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quiz: {room?.quiz?.title} • {players.length} connected players
            </p>
          </div>

          {/* Master Control Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {status === 'WAITING' ? (
              <button
                onClick={handleStartRoom}
                className="btn-primary text-base py-3 px-8 shadow-md"
              >
                ▶️ Start Contest
              </button>
            ) : status === 'PAUSED' ? (
              <button
                onClick={handleResume}
                className="btn-primary text-sm py-2.5 px-5"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                ⏸️ Pause
              </button>
            )}

            {status === 'LIVE' && (
              <>
                <button
                  onClick={handleNext}
                  className="btn-secondary text-sm py-2.5 px-4"
                  title="Skip to next question"
                >
                  ⏭️ Skip / Next Q
                </button>
                <button
                  onClick={handleExtend}
                  className="btn-secondary text-sm py-2.5 px-4"
                  title="Add 30 seconds to timer"
                >
                  ⏱️ +30s
                </button>
                <button
                  onClick={handleEnd}
                  className="btn-danger text-sm py-2.5 px-4"
                >
                  ⏹️ End Quiz
                </button>
              </>
            )}

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="btn-outline text-sm py-2.5 px-4"
            >
              {isExporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
          </div>
        </div>

        {/* Console Grid: Live Players Status & Integrity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Player Status List */}
          <div className="lg:col-span-2 card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Connected Players ({players.length})
              </h2>
              <span className="text-xs text-gray-400">Live Connection Health</span>
            </div>

            {players.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                Waiting for students to join room code {code}...
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {players.map((p, idx) => (
                  <div key={p.id || idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 font-bold flex items-center justify-center text-xs">
                        {(p.user?.name || p.nickname || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {p.user?.name || p.nickname || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Score: {p.score || 0} pts • Streak: {p.streak || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          p.isConnected !== false ? 'bg-success-500' : 'bg-danger-500'
                        }`}
                        title={p.isConnected !== false ? 'Online' : 'Disconnected'}
                      />
                      <span className="text-xs text-gray-400">
                        {p.isConnected !== false ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anti-cheat Integrity Feed */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🛡️</span> Integrity Flags
              </h2>
              <span className="badge-warning text-xs font-mono">{integrityFlags.length}</span>
            </div>

            {integrityFlags.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No anti-cheat flags recorded. All student sessions verified clean.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {integrityFlags.map((flag, idx) => (
                  <div
                    key={flag.id || idx}
                    className="p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-danger-700 dark:text-danger-300">
                      <span>{flag.type}</span>
                      <span>{flag.severity}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Player: {flag.playerId?.slice(0, 8)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
