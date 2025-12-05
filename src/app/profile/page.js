'use client';

import { useState, useEffect } from 'react';

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
  if (loading) return <div className="text-center mt-20 text-black font-bold">Loading profile...</div>;

  // RENDER: Not Logged In State
  if (notLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-900 font-medium mb-6">You must be logged in to view your profile.</p>
          <a 
            href="/login" 
            className="inline-block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition font-bold"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // RENDER: User Not Found
  if (!user) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-600 font-bold mb-4">User profile not found.</p>
        <button onClick={handleLogout} className="text-blue-600 font-bold underline">Go Back to Login</button>
      </div>
    );
  }

  // RENDER: Main Profile UI
  return (
    <div className="min-h-screen flex flex-col items-center py-12 bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
          <h2 className="text-3xl font-bold text-blue-700">My Profile</h2>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-bold"
            >
              Edit Details
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full p-2 border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Contact Number</label>
              <input
                type="text"
                placeholder="e.g. +88017..."
                className="w-full p-2 border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black font-medium"
                value={formData.contactNumber || ''}
                onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700 transition font-bold">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400 transition font-bold">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Name</p>
                    <p className="text-lg font-bold text-gray-900">{user.name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Role</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1 font-bold">
                        {user.role}
                    </span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Email</p>
                    <p className="text-lg font-bold text-gray-900">{user.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Contact</p>
                    <p className="text-lg font-bold text-gray-900">{user.contactNumber || 'Not set'}</p>
                </div>
            </div>
          </div>
        )}

        <hr className="my-8 border-gray-300" />
        
        <div className="flex justify-between items-center">
          <button onClick={handleLogout} className="text-gray-600 hover:text-black font-bold">Log Out</button>
          <button onClick={handleDelete} className="text-red-600 hover:text-red-800 font-bold hover:bg-red-50 px-3 py-2 rounded transition">Delete Account</button>
        </div>
      </div>
    </div>
  );
}