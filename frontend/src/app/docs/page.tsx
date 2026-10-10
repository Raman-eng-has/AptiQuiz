import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Guides & Architecture</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            AptiQuiz Documentation
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Learn how to use, host, participate, and build questions in AptiQuiz.
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Quick Start Guide</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Students can immediately enter any active session by visiting the <strong>/join</strong> page and submitting a 6-digit room code. Authentication is optional for open guest lobbies, while verified tournaments require college login.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Host Controls</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Faculty and hosts have real-time administrative consoles allowing:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Starting, pausing, and resuming timed rounds.</li>
              <li>Extending remaining time by 30 seconds if a question needs more discussion.</li>
              <li>Live attendance tracking and CSV exports for grading.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Power-Ups</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Each player receives strategic power-ups per quiz:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>Double Points:</strong> Multiplies earned score by 2x if answered correctly.</li>
              <li><strong>50-50:</strong> Removes two incorrect distractors.</li>
              <li><strong>Time Freeze:</strong> Adds +5 extra seconds to solve.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
