'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center">
          <span className="badge-primary mb-2">Get In Touch</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Contact Support & Campus Partnerships
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Have questions about hosting an inter-college tournament? Drop us a message.
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <span className="text-4xl block">📬</span>
              <h3 className="text-xl font-bold text-success-600">Message Received!</h3>
              <p className="text-sm text-gray-500">
                Our support team will get back to your email within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="input"
                />
              </div>

              <div>
                <label className="label">College Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@college.edu"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Message / Inquiry</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your campus tournament or inquiry..."
                  className="input"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-3 text-base">
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
