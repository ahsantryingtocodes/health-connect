'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // 1. Check for logged-in user on page load
  useEffect(() => {
    const loggedInEmail = localStorage.getItem('userEmail');
    
    if (!loggedInEmail) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    fetchProfile(loggedInEmail);
  }, []);

  // 2. Fetch Profile Data
  const fetchProfile = async (email) => {
    try {
      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();
      
      if (res.ok) {
        setUser(data);
        setFormData(data); 
      } else {
        alert("User not found.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // 4. Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Update failed: ' + (typeof data.message === 'string' ? data.message : 'Unknown error'));
      }
    } catch (err) {
      alert('Error updating profile');
    }
  };

  // 5. Handle Delete
  const handleDelete = async () => {
    if (!confirm('WARNING: Are you sure you want to delete your account? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/profile?email=${user.email}`, { method: 'DELETE' });
      if (res.ok) {
        localStorage.removeItem('userEmail');
        alert('Account deleted.');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      alert('Error deleting account');
    }
  };

  // RENDER: Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] pt-24">
        <div className="text-[#0F2D52] font-bold text-lg">Loading profile...</div>
      </div>
    );
  }

  // RENDER: Not Logged In State
  if (notLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F7FF] p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bg-white p-10 rounded-[24px] card-shadow text-center max-w-md w-full"
        >
          <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-wide">Access Denied</h2>
          <p className="text-[#4a5568] font-semibold mb-8">You must be logged in to view your profile.</p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <a 
              href="/login" 
              className="inline-block w-full bg-[#739AF0] text-white py-3 px-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold shadow-lg"
            >
              Go to Login
            </a>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // RENDER: User Not Found
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] pt-24">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">User profile not found.</p>
          <button onClick={handleLogout} className="text-[#739AF0] font-semibold hover:underline">Go Back to Login</button>
        </div>
      </div>
    );
  }

  // RENDER: Main Profile UI
  return (
    <div className="min-h-screen flex flex-col items-center py-12 bg-[#F0F7FF] p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="bg-white p-10 rounded-[24px] card-shadow w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-8 border-b-2 border-[#F0F7FF] pb-6">
          <h2 className="text-4xl font-bold text-[#0F2D52] tracking-wide">My Profile</h2>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setIsEditing(true)} 
              className="px-6 py-2 text-sm bg-[#F0F7FF] text-[#739AF0] rounded-[20px] hover:bg-[#739AF0] hover:text-white transition-colors duration-300 font-semibold shadow-md"
            >
              Edit Details
            </motion.button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Full Name</label>
              <input
                type="text"
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] font-medium transition-all duration-300"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Contact Number</label>
              <input
                type="text"
                placeholder="e.g. +88017..."
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] font-medium transition-all duration-300"
                value={formData.contactNumber || ''}
                onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
              />
            </div>
            <div className="flex gap-4 pt-2">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="flex-1 bg-[#739AF0] text-white p-3 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold shadow-lg"
              >
                Save Changes
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setIsEditing(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="flex-1 bg-[#F0F7FF] text-[#0F2D52] p-3 rounded-[20px] hover:bg-gray-200 transition-colors duration-300 font-semibold shadow-md"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-[#F0F7FF] rounded-[20px] border-2 border-transparent hover:border-[#739AF0] transition-all duration-300"
                >
                    <p className="text-xs text-[#4a5568] uppercase font-bold tracking-wide mb-2">Name</p>
                    <p className="text-lg font-bold text-[#0F2D52]">{user.name}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-[#F0F7FF] rounded-[20px] border-2 border-transparent hover:border-[#739AF0] transition-all duration-300"
                >
                    <p className="text-xs text-[#4a5568] uppercase font-bold tracking-wide mb-2">Role</p>
                    <span className="inline-block bg-[#739AF0] text-white text-xs px-3 py-1 rounded-full mt-1 font-semibold">
                        {user.role}
                    </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 bg-[#F0F7FF] rounded-[20px] border-2 border-transparent hover:border-[#739AF0] transition-all duration-300"
                >
                    <p className="text-xs text-[#4a5568] uppercase font-bold tracking-wide mb-2">Email</p>
                    <p className="text-lg font-bold text-[#0F2D52]">{user.email}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 bg-[#F0F7FF] rounded-[20px] border-2 border-transparent hover:border-[#739AF0] transition-all duration-300"
                >
                    <p className="text-xs text-[#4a5568] uppercase font-bold tracking-wide mb-2">Contact</p>
                    <p className="text-lg font-bold text-[#0F2D52]">{user.contactNumber || 'Not set'}</p>
                </motion.div>
            </div>
          </div>
        )}

        <hr className="my-8 border-[#F0F7FF]" />
        
        {/* Role-based Navigation */}
        {user.role === 'PATIENT' && (
          <div className="mb-6 space-y-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <a
                href="/book-appointment"
                className="block w-full bg-[#739AF0] text-white py-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold text-center shadow-lg"
              >
                Book Appointment
              </a>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <a
                href="/patient-dashboard"
                className="block w-full bg-white text-[#739AF0] border-2 border-[#739AF0] py-4 rounded-[20px] hover:bg-[#F0F7FF] transition-colors duration-300 font-semibold text-center shadow-lg"
              >
                My Appointments Dashboard
              </a>
            </motion.div>
          </div>
        )}
        
        {user.role === 'DOCTOR' && (
          <div className="mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <a
                href="/doctor-dashboard"
                className="block w-full bg-[#739AF0] text-white py-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold text-center shadow-lg"
              >
                Go to Doctor Dashboard
              </a>
            </motion.div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="text-[#4a5568] hover:text-[#0F2D52] font-semibold transition-colors duration-300"
          >
            Log Out
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 font-semibold hover:bg-red-50 px-4 py-2 rounded-[20px] transition-all duration-300"
          >
            Delete Account
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
