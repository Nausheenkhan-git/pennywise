'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Alert {
  id: string;
  category: string | null;
  threshold: number;
  isActive: boolean;
  month: string;
}

export default function AlertSettings() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [newThreshold, setNewThreshold] = useState(80);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      router.push('/onboarding');
      return;
    }
    setUserId(id);
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(month);
    fetchAlerts(id, month);
  }, [router]);

  const fetchAlerts = async (userId: string, month: string) => {
    try {
      const response = await fetch(`/api/budget-alerts?userId=${userId}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        if (data.length > 0) {
          setNewThreshold(data[0].threshold);
        }
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/budget-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          month: currentMonth,
          threshold: newThreshold,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(prev => [data, ...prev]);
        setMessage('✅ Alert created successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error || 'Failed to create alert'}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateAlert = async (id: string, updates: Partial<Alert>) => {
    try {
      const response = await fetch('/api/budget-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(prev => prev.map(a => a.id === id ? data : a));
        setMessage('✅ Alert updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/budget-alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        setMessage('✅ Alert deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-700 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔔 Budget Alert Settings</h1>
          <Link
            href="/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition font-medium shadow-sm"
          >
            ← Back to Profile
          </Link>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Create New Alert */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create Budget Alert</h2>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alert Threshold (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You'll be alerted when spending reaches this percentage of your income
              </p>
            </div>
            <button
              onClick={createAlert}
              disabled={saving || !newThreshold}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </div>

        {/* Existing Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Alerts</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No budget alerts set</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create an alert above to get notified</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      }`}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {alert.threshold}% Threshold
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateAlert(alert.id, { isActive: !alert.isActive })}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                    >
                      {alert.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-white">💡 How Budget Alerts Work</h3>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Alerts trigger when your spending reaches the threshold percentage</li>
            <li>They appear on your dashboard as colored notifications</li>
            <li>You can set different thresholds for different months</li>
            <li>Default alert triggers at 80% and 100% of budget</li>
          </ul>
        </div>
      </div>
    </div>
  );
}