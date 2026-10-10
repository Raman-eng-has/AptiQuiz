'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex flex-col justify-between">
      <Navbar />

      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                New: Team Battles & League Seasons
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6"
            >
              Real-time Multiplayer{' '}
              <span className="text-primary-600 dark:text-primary-400">Aptitude Quizzes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto"
            >
              Join live rooms with up to 50 players. Race through quant, logic, verbal & DI questions.
              Live leaderboards, leagues, badges & analytics. Built for college students.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register" className="btn-primary text-lg px-8 py-3 w-full sm:w-auto">
                Start Free - No Credit Card
              </Link>
              <Link href="/quiz/explore" className="btn-outline text-lg px-8 py-3 w-full sm:w-auto">
                Browse Public Quizzes
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
            >
              <span className="flex items-center gap-1">🔒 Fair Play</span>
              <span className="flex items-center gap-1">📱 PWA Ready</span>
              <span className="flex items-center gap-1">🌙 Dark Mode</span>
              <span className="flex items-center gap-1">♿ Accessible</span>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </motion.div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need for{' '}
              <span className="text-primary-600 dark:text-primary-400">competitive prep</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From placement prep to GATE practice - create, host, and compete.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Live Multiplayer',
                desc: 'Up to 50 players simultaneously. Real-time sync with sub-100ms latency.',
              },
              {
                icon: '🏆',
                title: 'Leagues & Seasons',
                desc: 'College, branch, semester & global rankings. Elo-style ratings.',
              },
              {
                icon: '🎯',
                title: 'Smart Scoring',
                desc: 'Accuracy + speed + streaks + power-ups. Fair, transparent, fun.',
              },
              {
                icon: '📊',
                title: 'Deep Analytics',
                desc: 'Per-question stats, topic radar, struggle detection, exports.',
              },
              {
                icon: '🛡️',
                title: 'Anti-Cheat',
                desc: 'Shuffled options, parameterized Qs, focus tracking, integrity scores.',
              },
              {
                icon: '📱',
                title: 'Installable PWA',
                desc: 'Works offline, installs on any device, push notifications.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="card-hover p-6"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Preparation Pillars */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Assessment Categories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Designed according to corporate placement patterns and competitive standard syllabi
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center">
            {[
              { title: 'Quantitative Aptitude', count: '1,200+ Questions', icon: '📐' },
              { title: 'Logical Reasoning', count: '950+ Questions', icon: '🧩' },
              { title: 'Verbal Ability', count: '800+ Questions', icon: '📖' },
              { title: 'Data Interpretation', count: '500+ Questions', icon: '📊' },
            ].map((cat) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="card p-6 text-center space-y-2"
              >
                <span className="text-3xl block">{cat.icon}</span>
                <div className="text-base font-bold text-gray-900 dark:text-white">{cat.title}</div>
                <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{cat.count}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Ready to level up your aptitude game?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-primary-100 mb-8 max-w-2xl mx-auto"
          >
            Create your free account in seconds. No credit card required. Cancel anytime.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3 w-full sm:w-auto font-semibold">
              Create Free Account
            </Link>
            <Link href="/quiz/explore" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-3 w-full sm:w-auto font-semibold">
              Explore Quizzes First
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}