'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof LoginFormData;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Sign In to AptiQuiz
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Compete live, level up your ranking, and track placement readiness.
            </p>
          </div>

          {apiError && (
            <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="student@college.edu"
                required
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                required
              />
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-base py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Create an account
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
