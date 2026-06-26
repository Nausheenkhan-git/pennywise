'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatAmount, getDefaultCurrency } from '../lib/currency';
import { useTheme } from '../context/ThemeContext';
import DashboardLayout from '../components/DashboardLayout';
import BudgetAlert from '../components/BudgetAlert';

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
  currency: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  month: string;
  type: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#845EC2'];

export default function Dashboard() {
  const router = useRouter();
  // Safe theme usage
  let theme = 'light';
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available, using defaults');
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievementAlert, setShowAchievementAlert] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState('QAR');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/onboarding');
      return;
    }

    const savedCurrency = getDefaultCurrency();
    setDisplayCurrency(savedCurrency);

    fetchData(userId);
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const userResponse = await fetch(`/api/user?id=${userId}`);
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      const userData = await userResponse.json();
      setUserData(userData);

      if (userData.currency) {
        setDisplayCurrency(userData.currency);
      }

      await fetchAllExpenses(userId);
      await fetchAchievements(userId);
    } catch (error) {
      console.error('Error fetching data:', error);
      localStorage.removeItem('userId');
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async (userId: string) => {
    try {
      const expenseResponse = await fetch(`/api/expenses?userId=${userId}`);
      if (!expenseResponse.ok) throw new Error('Failed to fetch expenses');
      const expenseData = await expenseResponse.json();
      setAllExpenses(expenseData);
      filterExpensesByMonth(expenseData, selectedMonth);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchAchievements = async (userId: string) => {
    try {
      const achResponse = await fetch(`/api/achievements?userId=${userId}`);
      if (achResponse.ok) {
        const achData = await achResponse.json();
        setAchievements(achData);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const filterExpensesByMonth = (expenses: Expense[], month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const filtered = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === year && expDate.getMonth() === monthNum - 1;
    });
    setFilteredExpenses(filtered);
  };

  const fetchExpensesForMonth = async (userId: string, month: string) => {
    try {
      const expenseResponse = await fetch(`/api/expenses?userId=${userId}&month=${month}`);
      if (!expenseResponse.ok) throw new Error('Failed to fetch expenses');
      const expenseData = await expenseResponse.json();
      setFilteredExpenses(expenseData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setDeleting(expenseId);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          await fetchAllExpenses(userId);
          await fetchAchievements(userId);
        }
      } else {
        alert('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Network error. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleMonthChange = async (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + (direction === 'prev' ? -1 : 1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);

    const userId = localStorage.getItem('userId');
    if (userId) {
      await fetchExpensesForMonth(userId, newMonth);
    }
  };

  const getWeeklyData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
      amount: filteredExpenses
        .filter(e => e.date.split('T')[0] === date)
        .reduce((sum, e) => sum + e.amount, 0),
    }));
  };

  const getCategoryData = () => {
    const categoryTotals = filteredExpenses.reduce((acc: any, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, displayCurrency);
  };

  const currentMonthSpending = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentMonthSavings = (userData?.monthlyIncome || 0) - currentMonthSpending;
  const savingsProgress = userData?.savingsGoal
    ? (currentMonthSavings / userData.savingsGoal) * 100
    : 0;

  const recentExpenses = filteredExpenses.slice(0, 5);
  const achievementsCount = achievements.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">Loading your dashboard...</div>
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

  return (
    <DashboardLayout achievementsCount={achievementsCount}>
      {/* Achievement Alert */}
      {showAchievementAlert && newAchievement && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900/80 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg shadow-lg max-w-md animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{newAchievement.icon}</span>
            <div>
              <h4 className="font-bold">🎉 New Achievement!</h4>
              <p className="text-sm">{newAchievement.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{newAchievement.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {userData.email.split('@')[0]}! Here's your financial overview.
        </p>
      </div>

      {/* Budget Alert */}
      <BudgetAlert
        userId={userData.id}
        month={selectedMonth}
        monthlyIncome={userData.monthlyIncome}
        currentSpending={currentMonthSpending}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(userData.monthlyIncome)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentMonthSpending)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Wallet className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saved</p>
              <p className={`text-2xl font-bold ${currentMonthSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {currentMonthSavings >= 0 ? '' : '-'}{formatCurrency(Math.abs(currentMonthSavings))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <PiggyBank className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.min(Math.round(savingsProgress), 100)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                savingsProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(Math.round(savingsProgress), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <Link
          href={`/expenses/add?month=${selectedMonth}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium"
        >
          <Plus size={20} />
          Add Expense
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1 - Spending Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getWeeklyData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9ca3af" />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{
                  backgroundColor: '#fff',
                  borderColor: '#e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 - Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          {filteredExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500 dark:text-gray-400">
              No expenses yet. Start adding!
            </div>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleMonthChange('prev')}
          className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          ← Previous
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => handleMonthChange('next')}
          className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Next →
        </button>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Expenses
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredExpenses.length} total
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No expenses for this month.
            <Link
              href={`/expenses/add?month=${selectedMonth}`}
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${
                    expense.amount > 100 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'
                  }`}>
                    {expense.amount > 100 ? (
                      <ArrowDownRight className="text-red-600 dark:text-red-400" size={20} />
                    ) : (
                      <ArrowUpRight className="text-blue-600 dark:text-blue-400" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/expenses/edit/${expense.id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleting === expense.id}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      {deleting === expense.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}