'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditExpense({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: '',
  });

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Education', 'Bills', 'Other'];

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(`/api/expenses/${params.id}`);
        
        if (!response.ok) {
          const text = await response.text();
          let errorMessage = 'Expense not found';
          try {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
          setError(errorMessage);
          setFetching(false);
          return;
        }

        const data = await response.json();
        setExpense({
          description: data.description,
          amount: data.amount.toString(),
          category: data.category,
          date: new Date(data.date).toISOString().split('T')[0],
        });
      } catch (error) {
        console.error('❌ Error fetching expense:', error);
        setError('Failed to load expense');
      } finally {
        setFetching(false);
      }
    };

    fetchExpense();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expense.description,
          amount: parseFloat(expense.amount),
          category: expense.category,
          date: expense.date,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to update expense';
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading expense...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-red-700 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">✏️ Edit Expense</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

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
              {loading ? 'Updating...' : 'Update Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}