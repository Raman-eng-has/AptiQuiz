import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BlogPage() {
  const articles = [
    {
      title: 'Top 10 Quantitative Aptitude Shortcuts for Campus Placements',
      category: 'Placement Prep',
      date: 'October 2026',
      desc: 'Master time and work, speed-distance-time, and probability shortcuts to finish your online rounds 30% faster.',
    },
    {
      title: 'How Parameterized Questions Eliminate Exam Collusion',
      category: 'Fair Play Engineering',
      date: 'September 2026',
      desc: 'An in-depth look at our dynamic parameter generation engine that assigns randomized numeric values to identical question models.',
    },
    {
      title: 'Scaling Real-Time WebSockets for 50 Simultaneous Players',
      category: 'Architecture',
      date: 'August 2026',
      desc: 'Optimizing Socket.IO broadcast intervals, latency credit windows, and room reconciliation under erratic college Wi-Fi.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Engineering & Prep Insights</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            AptiQuiz Blog
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Articles, guides, and engineering insights on competitive exams and live real-time platforms.
          </p>
        </div>

        <div className="space-y-6">
          {articles.map((art, idx) => (
            <div key={idx} className="card-hover p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-3">
                <span className="badge-primary">{art.category}</span>
                <span className="text-xs text-gray-400">{art.date}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 cursor-pointer">
                {art.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{art.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
