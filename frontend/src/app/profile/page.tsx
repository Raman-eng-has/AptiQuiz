'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FullUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  rating: number;
  integrityScore: number;
  streak: number;
  longestStreak: number;
  semester?: number;
  year?: number;
  createdAt: string;
  college?: { id: string; name: string; code: string };
  branch?: { id: string; name: string; code: string };
  _count?: { hostedRooms: number; roomPlayers: number; badges: number };
}

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.get<{ user: FullUserProfile }>('/users');
        if (data?.user) {
          setProfile(data.user);
          setEditName(data.user.name);
          setEditSemester(data.user.semester || 1);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch<{ user: Partial<FullUserProfile> }>('/users/profile', {
        name: editName,
        semester: editSemester,
      });
      if (res?.user) {
        setProfile((prev) => (prev ? { ...prev, ...res.user } : null));
        updateUser(res.user as any);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-success-600 dark:text-success-400 text-sm">
              Profile updated successfully!
            </div>
          )}

          {/* Profile Card Header */}
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-primary-500 text-white flex items-center justify-center text-4xl font-extrabold shadow-md">
                {(profile?.name || authUser?.name || 'U')[0].toUpperCase()}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                      {profile?.name || authUser?.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile?.email || authUser?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-secondary text-sm py-2 px-4 self-center sm:self-start"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <span className="badge-primary">{profile?.role || authUser?.role}</span>
                  {profile?.college?.name && (
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      🏫 {profile.college.name}
                    </span>
                  )}
                  {profile?.branch?.name && (
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      📚 {profile.branch.name}
                    </span>
                  )}
                  {profile?.semester && (
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      Sem {profile.semester}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <form onSubmit={handleUpdate} className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(parseInt(e.target.value))}
                    className="input"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="btn-primary py-2 px-6">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Stats & Integrity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <span className="text-3xl mb-2 block">⚡</span>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Elo Skill Rating</p>
              <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
                {profile?.rating ?? 1200}
              </p>
            </div>

            <div className="card p-6 text-center">
              <span className="text-3xl mb-2 block">🔥</span>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current / Max Streak</p>
              <p className="text-3xl font-extrabold text-amber-500 mt-1">
                {profile?.streak ?? 0} <span className="text-lg text-gray-400">/ {profile?.longestStreak ?? 0}</span>
              </p>
            </div>

            <div className="card p-6 text-center">
              <span className="text-3xl mb-2 block">🛡️</span>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Integrity Trust Score</p>
              <p className="text-3xl font-extrabold text-success-500 mt-1">
                {profile?.integrityScore ?? 100}%
              </p>
            </div>
          </div>

          {/* Badges and Activity summary */}
          <div className="card p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🎖️</span> Achievements & Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center">
                <span className="text-3xl">🏁</span>
                <p className="font-semibold text-sm mt-2 text-gray-900 dark:text-white">First Win</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed first live contest</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center">
                <span className="text-3xl">⚡</span>
                <p className="font-semibold text-sm mt-2 text-gray-900 dark:text-white">Speed Demon</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Under 5s correct answer</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center">
                <span className="text-3xl">🛡️</span>
                <p className="font-semibold text-sm mt-2 text-gray-900 dark:text-white">Fair Player</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">100% integrity streak</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center">
                <span className="text-3xl">🔥</span>
                <p className="font-semibold text-sm mt-2 text-gray-900 dark:text-white">Streak 7</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active for 7 consecutive days</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
