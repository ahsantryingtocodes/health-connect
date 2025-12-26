'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSpecializationOptions } from '@/utils/specializations';

export default function RegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '', // Added contactNumber to state
    role: 'PATIENT',
    specialization: '', // For doctors
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setStatus(data.message || 'Registration failed.');
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
        <h2 className="text-3xl font-bold mb-8 text-center text-[#0F2D52] tracking-wide">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              required
              placeholder="e.g. +88017..."
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">I am a...</label>
            <select
              name="role"
              className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] bg-white text-[#0F2D52] transition-all duration-300"
              onChange={handleChange}
              value={formData.role}
            >
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </div>

          {formData.role === 'DOCTOR' && (
            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Specialization *</label>
              <select
                name="specialization"
                required
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] bg-white text-[#0F2D52] transition-all duration-300"
                onChange={handleChange}
                value={formData.specialization}
              >
                <option value="">Select Specialization</option>
                {getSpecializationOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={status === 'loading'}
            whileHover={{ scale: status !== 'loading' ? 1.02 : 1 }}
            whileTap={{ scale: status !== 'loading' ? 0.98 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="w-full bg-[#739AF0] text-white p-3 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 disabled:bg-[#a0b5f0] disabled:cursor-not-allowed font-semibold mt-6 shadow-lg"
          >
            {status === 'loading' ? 'Creating Account...' : 'Sign Up'}
          </motion.button>
        </form>

        {status === 'success' && (
          <p className="mt-6 text-green-600 text-center text-sm font-semibold">Account created! Redirecting to login...</p>
        )}
        {status && status !== 'loading' && status !== 'success' && (
          <p className="mt-6 text-red-600 text-center text-sm font-semibold">{status}</p>
        )}

        <p className="mt-6 text-center text-sm text-[#4a5568]">
          Already have an account? <a href="/login" className="text-[#739AF0] hover:underline font-semibold">Login</a>
        </p>
      </motion.div>
    </div>
  );
}