import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Last updated: October 2026
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p>
              We collect your name, college email address, branch, semester, and quiz performance metrics (score, accuracy, response latencies) strictly to deliver leaderboards, analytics, and tournament results.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. Anti-Cheat & Integrity Telemetry</h2>
            <p>
              During active quiz sessions, we process client-side focus state changes and submission timing stamps solely for the purpose of validating contest integrity. No unauthorized screen captures or invasive personal device files are accessed.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Data Protection</h2>
            <p>
              Your passwords are encrypted using industry-standard bcrypt hashing. We do not sell your personal data to external advertisers.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
