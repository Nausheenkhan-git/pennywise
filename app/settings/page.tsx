'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { currencies, formatAmount, savePreferredCurrency } from '../lib/currency';

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('QAR');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/onboarding');
      return;
    }

    fetchUser(userId);
  }, [router]);

  const fetchUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setSelectedCurrency(data.currency || 'QAR');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    setLoading(true);
    setSuccessMessage('');

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/user/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currency: currencyCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCurrency(data.currency);
        savePreferredCurrency(data.currency);
        setSuccessMessage(`Currency updated to ${currencyCode}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update currency');
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Currency Settings</h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                disabled={loading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCurrency === currency.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{currency.symbol}</div>
                  <div className="text-sm font-semibold text-gray-700">{currency.code}</div>
                  <div className="text-xs text-gray-500">{currency.name}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 Your currency preference will be applied across the entire app.
              All amounts will be displayed in your selected currency.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-lg font-bold text-blue-600">
                {formatAmount(5000, selectedCurrency)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Expense</p>
              <p className="text-lg font-bold text-red-600">
                {formatAmount(150.50, selectedCurrency)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(250, selectedCurrency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}