'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
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
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    initSocket();

    async function loadRoomDetails() {
      try {
        const res = await api.get<{ room: any }>(`/rooms/code/${code}`);
        if (!isMounted) return;
        setRoom(res.room);
        setStatus(res.room.status);

        // Generate crisp unique Room QR code
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aptiquiz-phi.vercel.app';
        const joinUrl = `${origin}/join?code=${code}`;
        try {
          const clientQr = await QRCode.toDataURL(joinUrl, {
            width: 340,
            margin: 2,
            color: { dark: '#0284c7', light: '#ffffff' },
          });
          if (isMounted) setQrCodeData(clientQr);
        } catch {
          try {
            const qrRes = await api.get<{ qrCode: string }>(`/rooms/${res.room.id}/qr`);
            if (isMounted) setQrCodeData(qrRes.qrCode);
          } catch (e) {}
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`aptiquiz_joined_${code}`, 'true');
        }

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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiBase}/analytics/room/${room.id}/export?format=csv`, {
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

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 text-sm">
            {error}
          </div>
        )}

        {/* Host Console Header */}
        <div className="card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-primary-500">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-primary">Host Live Console</span>
              <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                Status: {status}
              </span>
              {status === 'WAITING' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  🟢 Entry Open (Lobby)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  🔒 Entry Locked (No Late Joins Allowed)
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Room Controls: <span className="font-mono text-primary-600">{code}</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quiz: {room?.quiz?.title} • {players.length} connected players
              {currentQuestionIndex >= 0 ? ` • Question #${currentQuestionIndex + 1}` : ''}
            </p>
          </div>

          {/* Master Control Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowProjectorModal(true)}
              className="btn-secondary text-sm py-2.5 px-4"
            >
              📽️ Projector / QR Screen
            </button>

            {status === 'WAITING' ? (
              <button
                onClick={handleStartRoom}
                className="btn-primary text-base py-3 px-8 shadow-md"
              >
                ▶️ Start Contest & Lock Entry
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

        {/* Console Grid: Live Players Status, Unique QR Card & Integrity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Player Status List */}
          <div className="lg:col-span-2 card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Connected Players ({players.length} / {room?.maxPlayers || 50})
              </h2>
              <span className="text-xs text-gray-400">Live Standings & Connection Health</span>
            </div>

            {players.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                Waiting for students to scan the QR code or enter room code <strong className="font-mono text-primary-600">{code}</strong>...
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedPlayers.map((p, idx) => (
                  <div key={p.id || idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs font-mono font-bold text-gray-400">
                        #{idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 font-bold flex items-center justify-center text-xs">
                        {(p.user?.name || p.nickname || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {p.user?.name || p.nickname || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Score: {p.score || 0} pts • Streak: 🔥 {p.streak || 0}
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

          {/* Right Column: Room QR Code & Anti-cheat Integrity Feed */}
          <div className="space-y-6">
            {/* Unique Room QR Card */}
            <div className="card p-6 text-center space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge-primary text-xs">Unique Room QR</span>
                <span className="font-mono font-black text-sm text-primary-600">PIN: {code}</span>
              </div>

              {qrCodeData ? (
                <div className="bg-white p-3 rounded-2xl inline-block shadow-md border border-gray-200">
                  <img
                    src={qrCodeData}
                    alt={`Room ${code} QR`}
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-xs text-gray-400">
                  Generating QR...
                </div>
              )}

              <p className="text-xs text-gray-500">
                {status === 'WAITING'
                  ? 'Students can scan this QR code right now to join the lobby.'
                  : '🔒 Entry is now locked! New scans will be blocked because the quiz has started.'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${code}` : '';
                    navigator.clipboard.writeText(url);
                    setCopiedJoinLink(true);
                    setTimeout(() => setCopiedJoinLink(false), 2000);
                  }}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  {copiedJoinLink ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                {qrCodeData && (
                  <a
                    href={qrCodeData}
                    download={`aptiquiz-room-${code}-qr.png`}
                    className="btn-secondary text-xs py-2 px-3 flex items-center justify-center"
                  >
                    ⬇️ Save QR
                  </a>
                )}
              </div>
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
                <div className="space-y-3 max-h-80 overflow-y-auto">
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
        </div>
      </main>

      {/* Fullscreen Projector / Spectator Modal */}
      {showProjectorModal && (
        <div
          className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-md text-white flex flex-col p-6 sm:p-10 overflow-y-auto"
          onClick={() => setShowProjectorModal(false)}
        >
          <div
            className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-between space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <span className="badge-primary text-xs">📽️ Classroom Projector & Spectator View</span>
                <h2 className="text-2xl sm:text-4xl font-black mt-1">
                  {room?.quiz?.title || 'AptiQuiz Live Battle'}
                </h2>
              </div>
              <button
                onClick={() => setShowProjectorModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-bold"
              >
                ✕ Exit Projector View
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Giant QR & Room PIN */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-5">
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-primary-950 text-primary-300 border border-primary-700">
                  {status === 'WAITING'
                    ? '🟢 SCAN TO JOIN BEFORE START'
                    : '🔒 QUIZ IN PROGRESS — ENTRY LOCKED'}
                </div>
                <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">
                  Room Join Code
                </p>
                <div className="text-6xl sm:text-7xl font-mono font-black tracking-widest text-primary-400">
                  {code}
                </div>
                {qrCodeData && (
                  <div className="bg-white p-5 rounded-3xl inline-block shadow-2xl">
                    <img src={qrCodeData} alt="Projector QR" className="w-64 h-64 mx-auto" />
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Scan QR or visit <span className="font-mono text-white">/join?code={code}</span>
                </p>
              </div>

              {/* Live Top 10 Standings */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold">
                    🏆 Live Classroom Standings ({players.length} Players)
                  </h3>
                  {status === 'WAITING' && (
                    <button
                      onClick={() => {
                        handleStartRoom();
                        setShowProjectorModal(false);
                      }}
                      className="btn-primary py-2 px-5 text-sm"
                    >
                      ▶️ Start Quiz Now
                    </button>
                  )}
                </div>
                {sortedPlayers.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    Waiting for participants to scan the QR code...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sortedPlayers.slice(0, 10).map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-800/80 border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary-600 text-white font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-base">
                            {p.user?.name || p.nickname || 'Player'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-400 font-bold">🔥 {p.streak || 0}</span>
                          <span className="font-mono font-extrabold text-primary-400">
                            {p.score || 0} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
