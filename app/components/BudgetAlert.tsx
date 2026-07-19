'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';


interface BudgetAlertProps {
  userId: string;
  month: string;
  monthlyIncome: number;
  currentSpending: number;
}

interface Alert {
  id: string;
  category: string | null;
  threshold: number;
  isActive: boolean;
}

export default function BudgetAlert({ userId, month, monthlyIncome, currentSpending }: BudgetAlertProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'warning' | 'danger' | 'success'>('success');

  useEffect(() => {
    fetchAlerts();
  }, [userId, month]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/budget-alerts?userId=${userId}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        checkBudgetStatus(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetStatus = (alerts: Alert[]) => {
    if (monthlyIncome === 0) return;
    
    const spendPercentage = (currentSpending / monthlyIncome) * 100;
    let message = '';
    let type: 'warning' | 'danger' | 'success' = 'success';

    // Check for active alerts
    const activeAlerts = alerts.filter(a => a.isActive);

    if (activeAlerts.length > 0) {
      // Find the most critical alert
      for (const alert of activeAlerts) {
        if (spendPercentage >= alert.threshold) {
          if (spendPercentage >= 100) {
            message = `⚠️ You have exceeded your budget! Spent ${spendPercentage.toFixed(0)}% of your income.`;
            type = 'danger';
            break;
          } else if (spendPercentage >= alert.threshold) {
            message = `⚠️ Budget Alert! You've used ${spendPercentage.toFixed(0)}% of your monthly income.`;
            type = 'warning';
            break;
          }
        }
      }
    } else {
      // Default alerts if no custom alerts set
      if (spendPercentage >= 100) {
        message = `⚠️ You have exceeded your budget! Spent ${spendPercentage.toFixed(0)}% of your income.`;
        type = 'danger';
      } else if (spendPercentage >= 80) {
        message = `⚠️ Warning! You've used ${spendPercentage.toFixed(0)}% of your monthly income.`;
        type = 'warning';
      } else if (spendPercentage <= 50 && currentSpending > 0) {
        message = `✅ You're on track! Only ${spendPercentage.toFixed(0)}% of budget used.`;
        type = 'success';
      }
    }

    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(!!message);
  };

  const dismissAlert = () => {
    setShowAlert(false);
  };

  if (loading) return null;

  if (!showAlert) return null;

  const getAlertStyles = () => {
    switch (alertType) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className={`mb-4 p-4 rounded-lg border ${getAlertStyles()} transition-colors duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium">{alertMessage}</p>
          <p className="text-sm mt-1 opacity-80">
            Budget: {monthlyIncome.toFixed(0)} | Spent: {currentSpending.toFixed(2)} ({((currentSpending / monthlyIncome) * 100).toFixed(0)}%)
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Link
            href="/settings/alerts"
            className="text-sm underline hover:no-underline whitespace-nowrap"
          >
            Configure
          </Link>
          <button
            onClick={dismissAlert}
            className="text-sm hover:opacity-70"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}