import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Our Mission</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            About AptiQuiz
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Empowering students to master aptitude and crack campus placements through live multiplayer competition.
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <p>
            Traditional aptitude preparation consists of solitary PDF reading and passive multiple-choice solving. AptiQuiz transforms this into a high-octane real-time multiplayer arena where colleges, departments, and peers compete with live synchronization.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-3xl font-extrabold text-primary-600">50+</span>
              <p className="text-xs text-gray-500 mt-1">Simultaneous Players per Room</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-3xl font-extrabold text-primary-600">&lt;100ms</span>
              <p className="text-xs text-gray-500 mt-1">Real-Time Sync Latency</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-3xl font-extrabold text-primary-600">100%</span>
              <p className="text-xs text-gray-500 mt-1">Fair Play Anti-Cheat Integrity</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
