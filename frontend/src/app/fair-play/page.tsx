import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FairPlayPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-4xl block">🛡️</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Fair Play Policy & Integrity System
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Ensuring genuine, trustworthy, and fair competitive aptitude assessments for college placements and tournaments.
          </p>
        </div>

        {/* Anti-cheat Pillars */}
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Multi-Layer Anti-Cheat Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
              <h3 className="font-bold text-base text-primary-600">1. Shuffled Options & Parameterized Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Option positions are independently scrambled per device. Quantitative questions dynamically generate unique numbers per seat, rendering answer-copying ineffective.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
              <h3 className="font-bold text-base text-primary-600">2. Focus & Tab-Visibility Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The platform monitors client focus transitions, document visibility state changes, and DevTools inspections during active quiz rounds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
              <h3 className="font-bold text-base text-primary-600">3. Clipboard & Context Restriction</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy, cut, and right-click interactions are disabled on problem statements and multiple choice selections to discourage search engine queries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
              <h3 className="font-bold text-base text-primary-600">4. Statistical Anomaly Detection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Server-side heuristics identify impossible reading speeds (answering long word problems in &lt;1 second) and synchronized submission times among adjacent seats.
              </p>
            </div>
          </div>
        </div>

        {/* The Fair Play Pledge */}
        <div className="card p-6 sm:p-8 space-y-4 border-2 border-primary-500 bg-primary-50/30 dark:bg-primary-900/10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🤝</span> The AptiQuiz Fair Play Pledge
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            As a student or host participating on AptiQuiz, I pledge to compete with honesty, intellectual integrity, and respect for my peers:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 pt-1">
            <li>I will answer questions solely using my own knowledge and analytical problem-solving abilities.</li>
            <li>I will not use external unauthorized AI tools, tab-switching extensions, or collaborative answer leaks.</li>
            <li>I understand that violations reduce my permanent Integrity Score and may exclude me from campus placement drives and season tournament leaderboards.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
