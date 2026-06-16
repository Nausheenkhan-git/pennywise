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

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    console.log('User ID from localStorage:', userId);
    
    if (!userId) {
      console.log('No userId found, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }

    fetchUserData(userId);
  }, [router]);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId);
      const response = await fetch(`/api/user/${userId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User data received:', data);
        setUserData(data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        if (response.status === 404) {
          localStorage.removeItem('userId');
          router.push('/onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">
          User not found. Please <Link href="/onboarding" className="text-blue-600 underline">sign up</Link> again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/expenses/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + Add Expense
          </Link>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600">
            Monthly Income: QAR {userData.monthlyIncome} | Savings Goal: QAR {userData.savingsGoal}
          </p>
        </div>

        {/* Placeholder for charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Spending</h3>
            <div className="text-gray-500 text-center py-8">
              No expenses yet. Add your first expense!
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
            <div className="text-gray-500 text-center py-8">
              No categories yet. Start tracking!
            </div>
          </div>
        </div>

        {/* Savings Goal Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Savings Progress</h3>
          <div className="text-gray-500 text-center py-4">
            Start saving to see your progress!
          </div>
        </div>
      </div>
    </div>
  );
}