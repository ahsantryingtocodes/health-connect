'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              required
              placeholder="e.g. +88017..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">I am a...</label>
            <select
              name="role"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              onChange={handleChange}
              value={formData.role}
            >
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </div>

          {formData.role === 'DOCTOR' && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Specialization *</label>
              <input
                type="text"
                name="specialization"
                required
                placeholder="e.g. Cardiology, Pediatrics, General Medicine"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                onChange={handleChange}
                value={formData.specialization}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 font-semibold mt-4"
          >
            {status === 'loading' ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {status === 'success' && (
          <p className="mt-4 text-green-600 text-center text-sm font-bold">Account created! Redirecting to login...</p>
        )}
        {status && status !== 'loading' && status !== 'success' && (
          <p className="mt-4 text-red-600 text-center text-sm font-bold">{status}</p>
        )}

        <p className="mt-4 text-center text-sm text-gray-700">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline font-bold">Login</a>
        </p>
      </div>
    </div>
  );
}