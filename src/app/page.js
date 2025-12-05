import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">HealthConnect</h1>
      <div className="space-x-4">
        <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Login
        </Link>
        <Link href="/register" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-gray-50">
          Register
        </Link>
      </div>
    </div>
  );
}