'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, DollarSign, Check, AlertCircle } from 'lucide-react';
import { currencies, formatAmount, savePreferredCurrency } from '../lib/currency';

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
  currency: string;
}

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('QAR');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');

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
        setSuccessMessage(`✅ Currency updated to ${currencyCode}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to update currency');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      setErrorMessage('Network error. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, selectedCurrency);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="text-gray-600" size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
        </div>
        <p className="text-gray-500 mb-8 ml-12 -mt-4">
          Manage your app preferences and currency settings
        </p>

        {/* Currency Settings Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Globe className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Currency Settings</h2>
              <p className="text-sm text-gray-500">
                Select your preferred currency for all transactions
              </p>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
              <Check className="text-green-600" size={20} />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              {errorMessage}
            </div>
          )}

          {/* Currency Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currencies.map((currency) => {
              const isSelected = selectedCurrency === currency.code;
              return (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  disabled={loading}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {currency.symbol}
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                      {currency.code}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {currency.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="text-white" size={12} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <DollarSign className="text-blue-600 mt-0.5" size={18} />
              <p className="text-sm text-gray-600">
                💡 Your currency preference will be applied across the entire app. 
                All amounts will be displayed in your selected currency.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {formatCurrency(user.monthlyIncome || 5000)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-sm text-gray-500">Sample Expense</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {formatCurrency(150.50)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
              <p className="text-sm text-gray-500">Sample Savings</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(250)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Preview shows how amounts will appear with your selected currency
          </p>
        </div>

        {/* Current Settings Summary */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Currency</span>
              <span className="font-semibold text-gray-900">
                {selectedCurrency} ({currencies.find(c => c.code === selectedCurrency)?.symbol})
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">Account</span>
              <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                {user?.email || 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}