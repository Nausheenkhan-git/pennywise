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
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#845EC2'];

type ChartView = 'weekly' | 'monthly' | 'yearly';

export default function Dashboard() {
  const router = useRouter();
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

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      router.push('/onboarding');
      return;
    }

    fetchData(userId);
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const userResponse = await fetch(`/api/user/${userId}`);
      if (!userResponse.ok) throw new Error('Failed to fetch user');
      const userData = await userResponse.json();
      setUserData(userData);

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
      
      // Check for achievements after fetching month data
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

  // Check and award achievements
  const checkAndAwardAchievements = async (userId: string, month: string, expenses: Expense[]) => {
    if (!userData) return;

    const monthlySpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySavings = userData.monthlyIncome - monthlySpending;

    console.log(`📊 Month: ${month}, Spending: ${monthlySpending}, Savings: ${monthlySavings}, Goal: ${userData.savingsGoal}`);

    // Check if savings goal was reached
    if (monthlySavings >= userData.savingsGoal) {
      console.log('🎯 Goal reached! Checking for existing achievement...');
      
      // Check if already awarded for this month
      const existingAch = achievements.find(
        a => a.type === 'goal_reached' && a.month === month
      );

      if (!existingAch) {
        console.log('🏆 Awarding achievement for month:', month);
        
        const response = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'goal_reached',
            name: '🎯 Goal Achiever!',
            description: `Saved ${monthlySavings.toFixed(2)} QAR in ${new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            icon: '🎯',
            month,
          }),
        });

        if (response.ok) {
          const newAch = await response.json();
          setNewAchievement(newAch);
          setShowAchievementAlert(true);
          setAchievements(prev => [newAch, ...prev]);
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setShowAchievementAlert(false);
          }, 5000);
        }
      } else {
        console.log('✅ Achievement already exists for this month');
      }
    } else {
      console.log(`❌ Goal not reached. Savings: ${monthlySavings} < Goal: ${userData.savingsGoal}`);
    }
  };

  // Get monthly spending with savings comparison - FILTER OUT FUTURE MONTHS
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
        // Mark future months
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

  // Calculate current month savings
  const currentMonthSpending = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentMonthSavings = (userData?.monthlyIncome || 0) - currentMonthSpending;
  const savingsProgress = userData?.savingsGoal 
    ? (currentMonthSavings / userData.savingsGoal) * 100 
    : 0;

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const recentExpenses = filteredExpenses.slice(0, 5);

  const renderChart = () => {
    switch (chartView) {
      case 'weekly':
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getWeeklyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `QAR ${value}`} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'monthly':
        const monthlyData = getMonthlyComparisonData();
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Monthly Spending vs Savings ({new Date().getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'savings') return [`QAR ${value}`, 'Savings'];
                    if (name === 'spending') return [`QAR ${value}`, 'Spending'];
                    if (name === 'income') return [`QAR ${value}`, 'Income'];
                    return [`QAR ${value}`, name];
                  }}
                  labelFormatter={(label) => {
                    // Check if this is a future month
                    const dataItem = monthlyData.find(d => d.month === label);
                    if (dataItem?.isFuture) {
                      return `${label} (Future)`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="spending" fill="#FF8042" name="Spending" />
                <Bar dataKey="savings" fill="#82ca9d" name="Savings" />
                <Line type="monotone" dataKey="income" stroke="#0088FE" strokeWidth={2} name="Income" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              * Future months are estimated and will update as you add expenses
            </p>
          </div>
        );
      case 'yearly':
        const yearlyData = getYearlyData();
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Yearly Spending vs Savings Trend</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'savings') return [`QAR ${value}`, 'Savings'];
                    if (name === 'spending') return [`QAR ${value}`, 'Spending'];
                    if (name === 'income') return [`QAR ${value}`, 'Income'];
                    return [`QAR ${value}`, name];
                  }}
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading...</div>
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
        {/* Achievement Alert */}
        {showAchievementAlert && newAchievement && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-md animate-bounce">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{newAchievement.icon}</span>
              <div>
                <h4 className="font-bold">🎉 New Achievement!</h4>
                <p className="text-sm">{newAchievement.name}</p>
                <p className="text-xs text-green-600">{newAchievement.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
          <div className="flex gap-3 w-full sm:w-auto">
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

        {/* User Info with Savings Goal Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome back, <span className="text-blue-600">{userData.email.split('@')[0]}</span>! 👋
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-700">QAR {userData.monthlyIncome}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm font-medium text-gray-600">Savings Goal</p>
              <p className="text-2xl font-bold text-green-700">QAR {userData.savingsGoal}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-gray-600">This Month's Spending</p>
              <p className="text-2xl font-bold text-purple-700">QAR {currentMonthSpending.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-lg border ${currentMonthSavings >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-sm font-medium text-gray-600">This Month's Savings</p>
              <p className={`text-2xl font-bold ${currentMonthSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {currentMonthSavings >= 0 ? 'QAR ' : '-QAR '}{Math.abs(currentMonthSavings).toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Savings Goal Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Savings Goal Progress</span>
              <span>{Math.min(Math.round(savingsProgress), 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  savingsProgress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(Math.round(savingsProgress), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chart View Selector */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChartView('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartView('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly Comparison
            </button>
            <button
              onClick={() => setChartView('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                chartView === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly Trend
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {renderChart()}
          
          {/* Category Pie Chart - Always visible */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Spending by Category</h3>
            {filteredExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100).toFixed(0))}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `QAR ${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-600 text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => handleMonthChange('prev')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              ← Previous Month
            </button>
            <h3 className="text-xl font-bold text-gray-900">
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

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📝 Recent Expenses</h3>
            <span className="text-sm text-gray-500">{filteredExpenses.length} total</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              No expenses for {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}. 
              <Link href={`/expenses/add?month=${selectedMonth}`} className="text-blue-600 hover:underline ml-1">
                Add your first expense
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{expense.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">QAR {expense.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/expenses/edit/${expense.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleting === expense.id}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
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
                  <span className="text-sm text-gray-500">Showing 5 of {filteredExpenses.length} expenses</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}