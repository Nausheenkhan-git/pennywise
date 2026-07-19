'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  achievementsCount?: number;
}

export default function DashboardLayout({ children, achievementsCount = 0 }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar achievementsCount={achievementsCount} />

      {/* Main Content - Add padding for mobile toggle button */}
      <main className="lg:ml-72 min-h-screen p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}