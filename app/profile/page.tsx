'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { currencies, formatAmount, savePreferredCurrency } from '../lib/currency';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
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
      console.log('📡 Profile: Fetching user data for ID:', userId);
      const userRes = await fetch(`/api/user?id=${userId}`);
      console.log('📡 Profile: Response status:', userRes.status);
      
      if (!userRes.ok) {
        const errorText = await userRes.text();
        console.error('❌ Profile: Error response:', errorText);
        throw new Error('Failed to fetch user');
      }
      
      const user = await userRes.json();
      console.log('✅ Profile: User data loaded:', user);
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
      console.error('❌ Profile: Error fetching data:', error);
      alert('Failed to load profile data. Please try again.');
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

  const totalSaved = monthlyStats.reduce((sum, stat) => sum + (stat.saved > 0 ? stat.saved : 0), 0);
  const totalSpent = monthlyStats.reduce((sum, stat) => sum + stat.spent, 0);
  const monthsWithGoal = monthlyStats.filter(s => s.goalReached).length;
  const currentMonthStats = monthlyStats[monthlyStats.length - 1];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">User not found. Please sign up again.</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, selectedCurrency);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👤 Profile</h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition font-medium shadow-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {userData.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{userData.email}</h2>
              <p className="text-gray-600 dark:text-gray-400">Member since {new Date(userData.createdAt).toLocaleDateString()}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(userData.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Savings Goal</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(userData.savingsGoal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(totalSaved)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center transition-colors duration-200">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyStats.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Months Tracked</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center transition-colors duration-200">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{monthsWithGoal}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Goals Reached</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center transition-colors duration-200">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{achievements.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center transition-colors duration-200">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {achievements.length > 0 ? '🏆' : '💪'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
          </div>
        </div>

        {/* Quick Stats - Current Month */}
        {currentMonthStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-md p-4 text-center border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Month</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">
                {new Date(currentMonthStats.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl shadow-md p-4 text-center border border-red-200 dark:border-red-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Spent</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">{formatCurrency(currentMonthStats.spent)}</p>
            </div>
            <div className={`bg-gradient-to-r rounded-xl shadow-md p-4 text-center border ${
              currentMonthStats.saved >= 0 
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800' 
                : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saved</p>
              <p className={`text-xl font-bold mt-1 ${currentMonthStats.saved >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {currentMonthStats.saved >= 0 ? '' : '-'}{formatCurrency(Math.abs(currentMonthStats.saved))}
              </p>
            </div>
          </div>
        )}

        {/* Settings Section - Currency & Dark Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">⚙️ Settings</h3>
          
          {/* Dark Mode Toggle */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">🌓 Dark Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                style={{
                  backgroundColor: theme === 'dark' ? '#3b82f6' : '#9ca3af'
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Current: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </div>
          </div>

          {/* Currency Settings */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">💰 Currency</h4>
            
            {currencyMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
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
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{currency.symbol}</div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{currency.code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currency.name}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Your currency preference will be applied across the entire app.
              </p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🏅 Achievements & Badges</h3>
          
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No achievements yet</p>
              <p className="text-gray-400 dark:text-gray-500">Start saving to earn badges! 💰</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tip: Save at least {formatCurrency(userData.savingsGoal)} in a month to earn your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{ach.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{ach.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ach.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📊 Monthly Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Spent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Saved</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No data yet. Start adding expenses!
                    </td>
                  </tr>
                ) : (
                  monthlyStats.map((stat) => (
                    <tr key={stat.month} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                        {new Date(stat.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{formatCurrency(stat.spent)}</td>
                      <td className={`py-3 px-4 font-semibold ${stat.saved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stat.saved >= 0 ? '' : '-'}{formatCurrency(Math.abs(stat.saved))}
                      </td>
                      <td className="py-3 px-4">
                        {stat.goalReached ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            🎯 Goal Reached!
                          </span>
                        ) : stat.saved >= 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                            💪 On Track
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                            ⚠️ Over Budget
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {monthlyStats.length > 0 && (
                <tfoot className="bg-gray-100 dark:bg-gray-700/50 font-semibold">
                  <tr>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">Total</td>
                    <td className="py-3 px-4 text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</td>
                    <td className={`py-3 px-4 ${totalSaved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {totalSaved >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalSaved))}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{monthlyStats.length} months</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}