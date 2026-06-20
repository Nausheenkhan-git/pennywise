'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { currencies, formatAmount, savePreferredCurrency } from '../lib/currency';

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
  createdAt: string;
  currency: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  month: string;
}

interface MonthlyStats {
  month: string;
  spent: number;
  saved: number;
  goalReached: boolean;
}

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('QAR');
  const [currencyUpdating, setCurrencyUpdating] = useState(false);
  const [currencyMessage, setCurrencyMessage] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/onboarding');
      return;
    }
    fetchProfileData(userId);
  }, [router]);

  const fetchProfileData = async (userId: string) => {
    try {
      // Fetch user data
      const userRes = await fetch(`/api/user/${userId}`);
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const user = await userRes.json();
      setUserData(user);
      setSelectedCurrency(user.currency || 'QAR');

      // Fetch achievements
      const achRes = await fetch(`/api/achievements?userId=${userId}`);
      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData);
      }

      // Fetch monthly stats
      const statsRes = await fetch(`/api/stats?userId=${userId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setMonthlyStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (currencyCode: string) => {
    setCurrencyUpdating(true);
    setCurrencyMessage('');

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
        setCurrencyMessage(`✅ Currency updated to ${currencyCode}`);
        setTimeout(() => setCurrencyMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update currency');
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('Network error. Please try again.');
    } finally {
      setCurrencyUpdating(false);
    }
  };

  // Calculate total savings
  const totalSaved = monthlyStats.reduce((sum, stat) => sum + (stat.saved > 0 ? stat.saved : 0), 0);
  const monthsWithGoal = monthlyStats.filter(s => s.goalReached).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-700">User not found. Please sign up again.</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, selectedCurrency);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👤 Profile</h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {userData.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{userData.email}</h2>
              <p className="text-gray-600">Member since {new Date(userData.createdAt).toLocaleDateString()}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(userData.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Savings Goal</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(userData.savingsGoal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Saved</p>
                  <p className="text-lg font-semibold text-purple-600">{formatCurrency(totalSaved)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{monthlyStats.length}</p>
            <p className="text-sm text-gray-600">Months Tracked</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{monthsWithGoal}</p>
            <p className="text-sm text-gray-600">Goals Reached</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{achievements.length}</p>
            <p className="text-sm text-gray-600">Badges Earned</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {achievements.length > 0 ? '🏆' : '💪'}
            </p>
            <p className="text-sm text-gray-600">Status</p>
          </div>
        </div>

        {/* Currency Settings Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Currency Settings</h3>
          
          {currencyMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {currencyMessage}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                disabled={currencyUpdating}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCurrency === currency.code
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{currency.symbol}</div>
                  <div className="text-sm font-semibold text-gray-700 mt-1">{currency.code}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{currency.name}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 Your currency preference will be applied across the entire app.
              All amounts will be displayed in your selected currency.
            </p>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏅 Achievements & Badges</h3>
          
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg mb-2">No achievements yet</p>
              <p className="text-gray-400">Start saving to earn badges! 💰</p>
              <p className="text-sm text-gray-400 mt-2">Tip: Save at least {formatCurrency(userData.savingsGoal)} in a month to earn your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-amber-200 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{ach.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{ach.name}</h4>
                      <p className="text-sm text-gray-600">{ach.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        🗓️ {new Date(ach.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Monthly Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Spent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Saved</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No data yet. Start adding expenses!
                    </td>
                  </tr>
                ) : (
                  monthlyStats.map((stat) => (
                    <tr key={stat.month} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {new Date(stat.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-gray-800">{formatCurrency(stat.spent)}</td>
                      <td className={`py-3 px-4 font-semibold ${stat.saved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.saved >= 0 ? '' : '-'}{formatCurrency(Math.abs(stat.saved))}
                      </td>
                      <td className="py-3 px-4">
                        {stat.goalReached ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            🎯 Goal Reached!
                          </span>
                        ) : stat.saved >= 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            💪 On Track
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            ⚠️ Over Budget
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}