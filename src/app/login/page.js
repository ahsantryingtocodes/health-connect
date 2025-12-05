'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Logging in...');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Save user email to browser storage
        localStorage.setItem('userEmail', data.user.email);
        setStatus('Success! Redirecting...');
        
        // Redirect to profile page using standard browser navigation
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      } else {
        setStatus(data.message || 'Login failed');
      }
    } catch (error) {
      setStatus('Failed to connect to server.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition font-semibold mt-4"
          >
            Login
          </button>
        </form>

        {status && (
          <p className={`mt-4 text-center text-sm font-bold ${status.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-700">
          Don't have an account? <a href="/registration" className="text-blue-600 hover:underline font-bold">Register</a>
        </p>
      </div>
    </div>
  );
}