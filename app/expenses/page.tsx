'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { formatAmount, getDefaultCurrency } from '../lib/currency';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface UserData {
  id: string;
  email: string;
  monthlyIncome: number;
  savingsGoal: number;
  currency: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayCurrency, setDisplayCurrency] = useState('QAR');

  const categories = ['All', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Education', 'Bills', 'Other'];

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
      const userRes = await fetch(`/api/user?id=${userId}`);
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const user = await userRes.json();
      setUserData(user);
      setDisplayCurrency(user.currency || 'QAR');

      const expenseRes = await fetch(`/api/expenses?userId=${userId}`);
      if (expenseRes.ok) {
        const data = await expenseRes.json();
        setExpenses(data);
        setFilteredExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          const expenseRes = await fetch(`/api/expenses?userId=${userId}`);
          if (expenseRes.ok) {
            const data = await expenseRes.json();
            setExpenses(data);
            setFilteredExpenses(data);
          }
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterExpenses(term, selectedCategory);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    filterExpenses(searchTerm, category);
  };

  const filterExpenses = (term: string, category: string) => {
    let filtered = expenses;

    if (term) {
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (category !== 'All') {
      filtered = filtered.filter(e => e.category === category);
    }

    setFilteredExpenses(filtered);
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, displayCurrency);
  };

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">Loading expenses...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all your expenses</p>
        </div>
        <Link
          href="/expenses/add"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium"
        >
          <Plus size={20} />
          Add Expense
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredExpenses.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average per Expense</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {expenses.length === 0 ? (
              <>
                <p className="text-lg mb-2">No expenses yet</p>
                <Link
                  href="/expenses/add"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add your first expense
                </Link>
              </>
            ) : (
              'No expenses match your search'
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    expense.amount > 100 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'
                  }`}>
                    {expense.amount > 100 ? (
                      <ArrowDownRight className="text-red-600 dark:text-red-400" size={20} />
                    ) : (
                      <ArrowUpRight className="text-blue-600 dark:text-blue-400" size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                        {expense.category}
                      </span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/expenses/edit/${expense.id}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleting === expense.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                    >
                      <Trash2 size={16} />
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