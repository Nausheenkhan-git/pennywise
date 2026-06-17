import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
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
          className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition shadow-lg inline-block"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}