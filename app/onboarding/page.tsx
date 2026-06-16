'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    monthlyIncome: '',
    savingsGoal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      if (response.ok) {
        const data = await response.json();
        // Store user ID in sessionStorage for demo purposes
        sessionStorage.setItem('userId', data.userId);
        router.push('/dashboard');
      } else {
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Welcome to PenneyWise
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's set up your budget profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="income" className="block text-sm font-medium text-gray-700">
                Monthly Income (QAR)
              </label>
              <input
                id="income"
                type="number"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 25000"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                Savings Goal (QAR)
              </label>
              <input
                id="goal"
                type="number"
                required
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5000"
                value={formData.savingsGoal}
                onChange={(e) => setFormData({ ...formData, savingsGoal: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Start Tracking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}