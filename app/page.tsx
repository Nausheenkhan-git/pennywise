import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          💰 PenneyWise
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Smart budgeting for students
        </p>
        <p className="text-gray-500 mb-8">
          Track expenses, set savings goals, and visualize your spending habits
        </p>
        <Link
          href="/onboarding"
          className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}