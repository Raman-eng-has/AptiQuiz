'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, isHostOrAdmin } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, [loadFromStorage]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Explore', href: '/quiz/explore' },
    { name: 'Leagues', href: '/leagues' },
    { name: 'Rankings', href: '/rankings' },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-sky-600 bg-clip-text text-transparent">
                AptiQuiz
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {mounted && isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    Dashboard
                  </Link>
                  {isHostOrAdmin() && (
                    <Link
                      href="/quiz/builder"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/quiz/builder'
                          ? 'text-primary-600 dark:text-primary-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      Quiz Builder
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/join" className="btn-outline text-sm py-1.5 px-3">
              Join with Code
            </Link>

            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                      {user.name}
                    </span>
                    <span className="text-xs text-primary-600 dark:text-primary-400 leading-tight">
                      {user.role}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-sm text-gray-500 hover:text-danger-500 py-1.5 px-3"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-ghost text-sm py-1.5 px-3">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm py-1.5 px-4">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/join"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-base font-medium text-primary-600"
          >
            Join with Code
          </Link>
          {mounted && isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-700 dark:text-gray-200"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-700 dark:text-gray-200"
              >
                Profile ({user.name})
              </Link>
              {isHostOrAdmin() && (
                <Link
                  href="/quiz/builder"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-base font-medium text-gray-700 dark:text-gray-200"
                >
                  Quiz Builder
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-2 text-base font-medium text-danger-500"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="btn-secondary w-full text-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="btn-primary w-full text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
