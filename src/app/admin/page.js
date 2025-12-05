'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Check if logged in user is ADMIN
    const checkAdmin = async () => {
        const email = localStorage.getItem('userEmail');
        if (!email) {
            window.location.href = '/login';
            return;
        }
        
        // Fetch current user info to verify role
        const res = await fetch(`/api/profile?email=${email}`);
        const data = await res.json();
        
        if (data.role !== 'ADMIN') {
            alert("Access Denied: Admins Only");
            window.location.href = '/profile';
        } else {
            setIsAdmin(true);
            fetchUsers();
        }
    };
    checkAdmin();
  }, []);

  const fetchUsers = async () => {
    try {
      // UPDATED: Removed '/users' because route.js is directly inside /api/admin
      const res = await fetch('/api/admin');
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      alert("Failed to load users");
    }
  };

  const verifyUser = async (email) => {
    // UPDATED: Removed '/users'
    const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isVerified: true }),
    });
    if (res.ok) fetchUsers(); // Refresh list
  };

  const deleteUser = async (email) => {
    if(!confirm("Delete this user?")) return;
    // UPDATED: Removed '/users'
    const res = await fetch(`/api/admin?email=${email}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-600">Checking Admin Privileges...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Admin Dashboard</h1>
            <a href="/profile" className="text-blue-600 hover:underline font-semibold">Back to Profile</a>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : user.role === 'DOCTOR' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isVerified ? (
                        <span className="text-green-600 font-bold text-sm">✓ Verified</span>
                    ) : (
                        <span className="text-red-500 font-bold text-sm">⚠ Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!user.isVerified && (
                        <button 
                            onClick={() => verifyUser(user.email)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-bold"
                        >
                            Approve
                        </button>
                    )}
                    <button 
                        onClick={() => deleteUser(user.email)}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-bold"
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}