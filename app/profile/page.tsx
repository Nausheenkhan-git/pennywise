'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Award, Settings as SettingsIcon } from 'lucide-react';
import { currencies, formatAmount, savePreferredCurrency } from '../lib/currency';
import { useTheme } from '../context/ThemeContext';
import DashboardLayout from '../components/DashboardLayout';

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
  // Safe theme usage
  let theme = 'light';
  let toggleTheme = () => {};
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    console.warn('Theme context not available, using defaults');
  }

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
      const userRes = await fetch(`/api/user?id=${userId}`);
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const user = await userRes.json();
      setUserData(user);
      setSelectedCurrency(user.currency || 'QAR');

      const achRes = await fetch(`/api/achievements?userId=${userId}`);
      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData);
      }

      const statsRes = await fetch(`/api/stats?userId=${userId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setMonthlyStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">User not found. Please sign up again.</div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, selectedCurrency);
  };

  return (
    <DashboardLayout achievementsCount={achievements.length}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
            {userData.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userData.email}</h2>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
              <Calendar size={16} />
              <span className="text-sm">Member since {new Date(userData.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400">💰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(userData.monthlyIncome)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <span className="text-green-600 dark:text-green-400">🎯</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Goal</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(userData.savingsGoal)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <Award className="text-purple-600 dark:text-purple-400" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Badges</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{achievements.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Months Tracked</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{monthlyStats.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Goals Reached</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{monthsWithGoal}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Currency Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Currency</h3>
          {currencyMessage && (
            <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {currencyMessage}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {currencies.slice(0, 8).map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                disabled={currencyUpdating}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedCurrency === currency.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{currency.symbol}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{currency.code}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Alert Settings */}
      <div className="mt-6">
        <Link
          href="/settings/alerts"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium"
        >
          <SettingsIcon size={20} />
          Configure Budget Alerts
        </Link>
      </div>

      {/* Achievements Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏅 Achievements</h3>
        {achievements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No achievements yet. Start saving to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <div key={ach.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{ach.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{ach.name}</h4>
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

      {/* Monthly Stats Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Performance</h3>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 font-medium">Spent</th>
                <th className="pb-3 font-medium">Saved</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {monthlyStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No data yet. Start adding expenses!
                  </td>
                </tr>
              ) : (
                monthlyStats.map((stat) => (
                  <tr key={stat.month} className="text-gray-900 dark:text-white">
                    <td className="py-3">
                      {new Date(stat.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3">{formatCurrency(stat.spent)}</td>
                    <td className={`py-3 font-semibold ${stat.saved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.saved >= 0 ? '' : '-'}{formatCurrency(Math.abs(stat.saved))}
                    </td>
                    <td className="py-3">
                      {stat.goalReached ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          🎯 Goal Reached!
                        </span>
                      ) : stat.saved >= 0 ? (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                          💪 On Track
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          ⚠️ Over Budget
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {monthlyStats.length > 0 && (
              <tfoot className="border-t border-gray-200 dark:border-gray-700">
                <tr className="font-semibold text-gray-900 dark:text-white">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-red-600 dark:text-red-400">{formatCurrency(totalSpent)}</td>
                  <td className={`py-3 ${totalSaved >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totalSaved >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalSaved))}
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{monthlyStats.length} months</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}