'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="bg-white p-10 rounded-[24px] card-shadow w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-[#0F2D52] tracking-wide">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] font-medium transition-all duration-300"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] font-medium transition-all duration-300"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="w-full bg-[#739AF0] text-white p-3 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold mt-6 shadow-lg"
          >
            Login
          </motion.button>
        </form>

        {status && (
          <p className={`mt-6 text-center text-sm font-semibold ${status.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-[#4a5568]">
          Don't have an account? <a href="/register" className="text-[#739AF0] hover:underline font-semibold">Register</a>
        </p>
      </motion.div>
    </div>
  );
}