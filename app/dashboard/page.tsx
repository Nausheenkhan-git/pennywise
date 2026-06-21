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
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { formatAmount, getDefaultCurrency } from '../lib/currency';
import { useTheme } from '../context/ThemeContext';

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

type ChartView = 'weekly' | 'monthly' | 'yearly';

export default function Dashboard() {
  const router = useRouter();
  // Safe theme usage with try-catch
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
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [chartView, setChartView] = useState<ChartView>('monthly');
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
      console.log('📡 Fetching data for user:', userId);
      
      const userResponse = await fetch(`/api/user?id=${userId}`);
      console.log('📡 User API Response status:', userResponse.status);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ User API Error:', errorText);
        throw new Error(`Failed to fetch user: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('✅ User data loaded:', userData);
      setUserData(userData);
      
      if (userData.currency) {
        setDisplayCurrency(userData.currency);
      }

      await fetchAllExpenses(userId);
      await fetchAchievements(userId);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
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
      
      await checkAndAwardAchievements(userId, month, expenseData);
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

  const checkAndAwardAchievements = async (userId: string, month: string, expenses: Expense[]) => {
    if (!userData) return;

    const monthlySpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySavings = userData.monthlyIncome - monthlySpending;

    if (monthlySavings >= userData.savingsGoal) {
      const existingAch = achievements.find(
        (a: Achievement) => a.type === 'goal_reached' && a.month === month
      );

      if (!existingAch) {
        const response = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'goal_reached',
            name: '🎯 Goal Achiever!',
            description: `Saved ${formatAmount(monthlySavings, displayCurrency)} in ${new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            icon: '🎯',
            month,
          }),
        });

        if (response.ok) {
          const newAch = await response.json();
          setNewAchievement(newAch);
          setShowAchievementAlert(true);
          setAchievements(prev => [newAch, ...prev]);
          
          setTimeout(() => {
            setShowAchievementAlert(false);
          }, 5000);
        }
      }
    }
  };

  const getMonthlyComparisonData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthlyIncome = userData?.monthlyIncome || 0;
    
    return months.map((month, index) => {
      const monthlySpending = allExpenses
        .filter(e => {
          const date = new Date(e.date);
          return date.getFullYear() === currentYear && date.getMonth() === index;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      const savings = monthlyIncome - monthlySpending;
      
      return {
        month,
        spending: monthlySpending,
        income: monthlyIncome,
        savings: savings > 0 ? savings : 0,
        overspent: savings < 0 ? Math.abs(savings) : 0,
        isFuture: index > currentMonth,
      };
    });
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

  const getYearlyData = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 4; i >= 0; i--) {
      years.push(currentYear - i);
    }
    
    return years.map(year => {
      const yearlySpending = allExpenses
        .filter(e => new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const yearlyIncome = (userData?.monthlyIncome || 0) * 12;
      const yearlySavings = yearlyIncome - yearlySpending;
      
      return {
        year: year.toString(),
        spending: yearlySpending,
        income: yearlyIncome,
        savings: yearlySavings > 0 ? yearlySavings : 0,
        overspent: yearlySavings < 0 ? Math.abs(yearlySavings) : 0,
        isFuture: year > currentYear,
      };
    });
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

  const renderChart = () => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    switch (chartView) {
      case 'weekly':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📈 Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getWeeklyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={textColor} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} stroke={textColor} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }}
                  labelStyle={{ color: isDark ? '#fff' : '#000' }}
                />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'monthly':
        const monthlyData = getMonthlyComparisonData();
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📊 Monthly Spending vs Savings ({new Date().getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" stroke={textColor} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} stroke={textColor} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'savings') return [formatCurrency(value as number), 'Savings'];
                    if (name === 'spending') return [formatCurrency(value as number), 'Spending'];
                    if (name === 'income') return [formatCurrency(value as number), 'Income'];
                    return [formatCurrency(value as number), name];
                  }}
                  labelFormatter={(label) => {
                    const dataItem = monthlyData.find(d => d.month === label);
                    if (dataItem?.isFuture) {
                      return `${label} (Future)`;
                    }
                    return label;
                  }}
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }}
                  labelStyle={{ color: isDark ? '#fff' : '#000' }}
                />
                <Legend />
                <Bar dataKey="spending" fill="#FF8042" name="Spending" />
                <Bar dataKey="savings" fill="#82ca9d" name="Savings" />
                <Line type="monotone" dataKey="income" stroke="#0088FE" strokeWidth={2} name="Income" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              * Future months are estimated and will update as you add expenses
            </p>
          </div>
        );
      case 'yearly':
        const yearlyData = getYearlyData();
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📈 Yearly Spending vs Savings Trend</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="year" stroke={textColor} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} stroke={textColor} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'savings') return [formatCurrency(value as number), 'Savings'];
                    if (name === 'spending') return [formatCurrency(value as number), 'Spending'];
                    if (name === 'income') return [formatCurrency(value as number), 'Income'];
                    return [formatCurrency(value as number), name];
                  }}
                  contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }}
                  labelStyle={{ color: isDark ? '#fff' : '#000' }}
                />
                <Legend />
                <Bar dataKey="spending" fill="#FF8042" name="Spending" />
                <Bar dataKey="savings" fill="#82ca9d" name="Savings" />
                <Line type="monotone" dataKey="income" stroke="#0088FE" strokeWidth={2} name="Income" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading...</div>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Dashboard</h1>
          <div className="flex gap-3 w-full sm:w-auto flex-wrap">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium shadow-sm text-center"
            >
              <span className="text-lg">🏆</span>
              <span>Profile</span>
              {achievements.length > 0 && (
                <span className="bg-yellow-400 text-gray-800 text-xs font-bold rounded-full px-2 py-0.5">
                  {achievements.length}
                </span>
              )}
            </Link>
            <Link
              href={`/expenses/add?month=${selectedMonth}`}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm w-full sm:w-auto text-center"
            >
              + Add Expense
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Welcome back, <span className="text-blue-600 dark:text-blue-400">{userData.email.split('@')[0]}</span>! 👋
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(userData.monthlyIncome)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Goal</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(userData.savingsGoal)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month's Spending</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(currentMonthSpending)}</p>
            </div>
            <div className={`p-4 rounded-lg border ${currentMonthSavings >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month's Savings</p>
              <p className={`text-2xl font-bold ${currentMonthSavings >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {currentMonthSavings >= 0 ? '' : '-'}{formatCurrency(Math.abs(currentMonthSavings))}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Savings Goal Progress</span>
              <span>{Math.min(Math.round(savingsProgress), 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  savingsProgress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(Math.round(savingsProgress), 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 transition-colors duration-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChartView('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartView('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Monthly Comparison
            </button>
            <button
              onClick={() => setChartView('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Yearly Trend
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {renderChart()}
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">🎯 Spending by Category</h3>
            {filteredExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                    labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                No expenses this month
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => handleMonthChange('prev')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              ← Previous Month
            </button>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => handleMonthChange('next')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Next Month →
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">📝 Recent Expenses</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredExpenses.length} total</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
              No expenses for {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}. 
              <Link href={`/expenses/add?month=${selectedMonth}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                Add your first expense
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{expense.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/expenses/edit/${expense.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium mr-3"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleting === expense.id}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                        >
                          {deleting === expense.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length > 5 && (
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Showing 5 of {filteredExpenses.length} expenses</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}