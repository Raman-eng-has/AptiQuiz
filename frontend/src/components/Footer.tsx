import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">AptiQuiz</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Real-time multiplayer aptitude quiz platform for college students.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/quiz/explore" className="hover:text-primary-600">Quiz Explorer</Link></li>
              <li><Link href="/quiz/builder" className="hover:text-primary-600">Quiz Builder</Link></li>
              <li><Link href="/leagues" className="hover:text-primary-600">Leagues</Link></li>
              <li><Link href="/rankings" className="hover:text-primary-600">Rankings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/docs" className="hover:text-primary-600">Documentation</Link></li>
              <li><Link href="/api-docs" className="hover:text-primary-600">API Reference</Link></li>
              <li><Link href="/fair-play" className="hover:text-primary-600">Fair Play Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-600">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/about" className="hover:text-primary-600">About</Link></li>
              <li><Link href="/blog" className="hover:text-primary-600">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-primary-600">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-primary-600">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AptiQuiz. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
