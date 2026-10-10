import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CareersPage() {
  const roles = [
    { title: 'Full Stack Engineer (Next.js / Node.js / Socket.IO)', type: 'Remote / Hybrid', team: 'Core Platform' },
    { title: 'Curriculum & Question Architect (Aptitude & GATE)', type: 'Full-time / Part-time', team: 'Content Operations' },
    { title: 'Campus Ambassador Lead', type: 'College Internship', team: 'Community Growth' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="badge-primary mb-2">Join Us</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Careers at AptiQuiz
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Build the next generation of competitive aptitude learning tools.
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((r, i) => (
            <div key={i} className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{r.team} • {r.type}</p>
              </div>
              <a
                href="mailto:careers@aptiquiz.com"
                className="btn-secondary text-xs py-2 px-4 self-start sm:self-auto"
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
