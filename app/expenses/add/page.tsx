'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Move the main component logic to a separate component
function AddExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [expense, setExpense] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: '',
  });

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Education', 'Bills', 'Other'];

  // Set default date from URL params
  useEffect(() => {
    const monthParam = searchParams.get('month');
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      setExpense(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0],
      }));
    } else {
      const today = new Date();
      setExpense(prev => ({
        ...prev,
        date: today.toISOString().split('T')[0],
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('Please sign in again');
        router.push('/onboarding');
        return;
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expense.description,
          amount: parseFloat(expense.amount),
          category: expense.category,
          userId,
          date: expense.date,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add expense');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">➕ Add Expense</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <input
                id="description"
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                placeholder="What did you spend on?"
                value={expense.description}
                onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-1">
                Amount (QAR)
              </label>
              <input
                id="amount"
                type="number"
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                placeholder="0.00"
                value={expense.amount}
                onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                value={expense.category}
                onChange={(e) => setExpense({ ...expense, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function AddExpensePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AddExpenseForm />
    </Suspense>
  );
}