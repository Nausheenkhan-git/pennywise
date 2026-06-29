'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, DollarSign, Target, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    monthlyIncome: '',
    savingsGoal: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          monthlyIncome: parseFloat(formData.monthlyIncome),
          savingsGoal: parseFloat(formData.savingsGoal),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userId', data.userId);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to create account');
        setLoading(false);
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              PW
            </div>
            <span className="text-xl font-bold text-gray-900">PenneyWise</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome aboard! 🎉
          </h1>
          <p className="text-gray-600 mt-2">
            Set up your budget profile to get started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Monthly Income Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monthly Income
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                  placeholder="e.g., 25000"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">QAR</span>
                </div>
              </div>
            </div>

            {/* Savings Goal Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Savings Goal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                  placeholder="e.g., 5000"
                  value={formData.savingsGoal}
                  onChange={(e) => setFormData({ ...formData, savingsGoal: e.target.value })}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">QAR</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Start Tracking
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
              Go to Dashboard
            </a>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="text-green-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Secure</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="text-blue-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Free</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="text-purple-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Privacy</p>
          </div>
        </div>
      </div>
    </div>
  );
}