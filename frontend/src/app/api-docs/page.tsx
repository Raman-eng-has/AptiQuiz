import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ApiDocsPage() {
  const endpoints = [
    { method: 'POST', path: '/api/auth/register', desc: 'Registers a new user and issues a JWT token.' },
    { method: 'POST', path: '/api/auth/login', desc: 'Authenticates user credentials and returns session token.' },
    { method: 'GET', path: '/api/quizzes', desc: 'Queries public quizzes with topic and difficulty filters.' },
    { method: 'POST', path: '/api/quizzes', desc: 'Creates a new quiz (HOST/ADMIN role required).' },
    { method: 'POST', path: '/api/rooms', desc: 'Creates a new live room and returns the 6-digit code.' },
    { method: 'GET', path: '/api/leaderboard/scope/:scope', desc: 'Returns global, daily, weekly or monthly Elo leaderboards.' },
    { method: 'GET', path: '/api/analytics/room/:id/export?format=csv', desc: 'Streams contest attendance and score report in CSV format.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Developer Integration</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            REST API Reference
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Documentation for the AptiQuiz Express & Socket.IO backend service.
          </p>
        </div>

        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {endpoints.map((ep, i) => (
            <div key={i} className="p-4 sm:p-6 space-y-1">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    ep.method === 'POST' ? 'bg-primary-100 text-primary-700' : 'bg-success-50 text-success-700'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {ep.path}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-14">{ep.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
