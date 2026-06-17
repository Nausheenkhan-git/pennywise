'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      // Fetch user data
      const userResponse = await fetch(`/api/user/${userId}`);
      if (!userResponse.ok) throw new Error('Failed to fetch user');
      const userData = await userResponse.json();
      setUserData(userData);

      // Fetch expenses
      await fetchExpenses(userId);
    } catch (error) {
      console.error('Error fetching data:', error);
      localStorage.removeItem('userId');
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async (userId: string) => {
    try {
      const expenseResponse = await fetch(`/api/expenses?userId=${userId}`);
      if (!expenseResponse.ok) throw new Error('Failed to fetch expenses');
      const expenseData = await expenseResponse.json();
      setExpenses(expenseData);
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
          await fetchExpenses(userId);
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

  // Calculate total spent
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
          <Link
            href="/expenses/add"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            + Add Expense
          </Link>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome back, <span className="text-blue-600">{userData.email.split('@')[0]}</span>! 👋
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-700">QAR {userData.monthlyIncome}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm font-medium text-gray-600">Savings Goal</p>
              <p className="text-2xl font-bold text-green-700">QAR {userData.savingsGoal}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-purple-700">QAR {totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Weekly Spending</h3>
            <div className="text-gray-600 text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              {expenses.length === 0 ? 'No expenses yet. Add your first expense!' : 'Charts coming soon!'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Spending by Category</h3>
            <div className="text-gray-600 text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              {expenses.length === 0 ? 'No categories yet. Start tracking!' : 'Charts coming soon!'}
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📝 Recent Expenses</h3>
            <span className="text-sm text-gray-500">{expenses.length} total</span>
          </div>
          
          {expenses.length === 0 ? (
            <div className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              No expenses yet. <Link href="/expenses/add" className="text-blue-600 hover:underline">Add your first expense</Link>
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
              {expenses.length > 5 && (
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-500">Showing 5 of {expenses.length} expenses</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}