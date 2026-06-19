'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
  createdAt: string;
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

  // Calculate total savings
  const totalSaved = monthlyStats.reduce((sum, stat) => sum + stat.saved, 0);
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
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              {userData.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{userData.email}</h2>
              <p className="text-gray-600">Member since {new Date(userData.createdAt).toLocaleDateString()}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="text-lg font-semibold text-blue-600">QAR {userData.monthlyIncome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Savings Goal</p>
                  <p className="text-lg font-semibold text-green-600">QAR {userData.savingsGoal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Saved</p>
                  <p className="text-lg font-semibold text-purple-600">QAR {totalSaved.toFixed(2)}</p>
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
              {totalSaved > 0 ? '🏆' : '💪'}
            </p>
            <p className="text-sm text-gray-600">Status</p>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏅 Achievements & Badges</h3>
          
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg mb-2">No achievements yet</p>
              <p className="text-gray-400">Start saving to earn badges! 💰</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{ach.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{ach.name}</h4>
                      <p className="text-sm text-gray-600">{ach.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ach.earnedAt).toLocaleDateString()}
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
                {monthlyStats.map((stat) => (
                  <tr key={stat.month} className="border-t border-gray-100">
                    <td className="py-3 px-4 text-gray-800">
                      {new Date(stat.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-800">QAR {stat.spent.toFixed(2)}</td>
                    <td className={`py-3 px-4 font-semibold ${stat.saved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      QAR {stat.saved.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {stat.goalReached ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          🎯 Goal Reached!
                        </span>
                      ) : stat.saved >= 0 ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          💪 On Track
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          ⚠️ Over Budget
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}