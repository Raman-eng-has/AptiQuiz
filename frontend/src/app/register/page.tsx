'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { UserRole } from '@aptiquiz/shared';
import { useAuthStore } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  semester: z.number().int().min(1).max(8).optional(),
  year: z.number().int().min(1).max(4).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    semester: 1,
    year: 1,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof RegisterFormData;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create your AptiQuiz Account
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Join thousands preparing for placements, GATE, and campus challenges.
            </p>
          </div>

          {apiError && (
            <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Alex Sharma"
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="email">
                College Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="alex@college.edu"
                required
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="role">
                  Account Type
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="input"
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.HOST}>Quiz Host / Faculty</option>
                  <option value={UserRole.COLLEGE_ADMIN}>College Admin</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="year">
                  College Year
                </label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-base py-3 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
