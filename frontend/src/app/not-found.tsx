import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-4xl font-extrabold shadow-sm">
            404
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sorry, we couldn&apos;t find the page you were looking for. It might have been moved or doesn&apos;t exist.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="btn-primary w-full sm:w-auto">
              Back to Home
            </Link>
            <Link href="/quiz/explore" className="btn-secondary w-full sm:w-auto">
              Explore Quizzes
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
