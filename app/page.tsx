import Link from 'next/link';
import { Wallet, PiggyBank, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              PW
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PenneyWise</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Smart Budgeting for
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> Students</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Track expenses, set savings goals, and visualize your spending habits with ease.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-lg"
          >
            View Demo
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Track Spending</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Log expenses and categorize them easily</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Save Smarter</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set goals and track your savings progress</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Visualize Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">See your spending patterns with beautiful charts</p>
          </div>
        </div>
      </div>
    </div>
  );
}