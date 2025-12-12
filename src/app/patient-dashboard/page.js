'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bannerNote, setBannerNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' | 'pending' | 'notifications'

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      router.push('/login');
      return;
    }

    fetchUserProfile(userEmail);
  }, [router]);

  useEffect(() => {
    if (user && user.role === 'PATIENT') {
      fetchAppointments();
      fetchNotifications();
    }
  }, [user]);

  // When notifications change, surface the newest unread as a banner
  useEffect(() => {
    const newestUnread = notifications.find((n) => !n.read);
    setBannerNote(newestUnread || null);
  }, [notifications]);

  const fetchUserProfile = async (email) => {
    try {
      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        if (data.role !== 'PATIENT') {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      // Fetch confirmed appointments
      const confirmedRes = await fetch(`/api/appointments/patient?patientId=${user.id}&status=CONFIRMED`);
      const confirmedData = await confirmedRes.json();
      if (confirmedRes.ok) {
        setConfirmedAppointments(confirmedData);
      }

      // Fetch pending appointments
      const pendingRes = await fetch(`/api/appointments/patient?patientId=${user.id}&status=PENDING`);
      const pendingData = await pendingRes.json();
      if (pendingRes.ok) {
        setPendingAppointments(pendingData);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/notifications?email=${user.email}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, read: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-black font-bold text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'PATIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-900 font-semibold mb-6">Only patients can access this dashboard.</p>
          <a href="/profile" className="text-blue-600 hover:underline font-bold">Go to Profile</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Unread Notification Banner */}
          {bannerNote && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-100 border border-yellow-200 text-gray-900 flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-yellow-900">New notification</p>
                <p className="text-sm mt-1">{bannerNote.message}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(bannerNote.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => markNotificationRead(bannerNote.id)}
                className="text-xs font-semibold text-blue-700 hover:underline ml-3"
              >
                Mark as read
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">My Appointments</h1>
              <p className="text-gray-900 font-semibold mt-1">Welcome, {user.name}</p>
            </div>
            <a href="/profile" className="text-blue-600 hover:underline font-semibold">← Back to Profile</a>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 mb-6">
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`px-6 py-3 font-bold transition ${
                activeTab === 'confirmed'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Confirmed Appointments ({confirmedAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-bold transition ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pending Requests ({pendingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-bold transition ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Notifications ({notifications.length})
            </button>
          </div>

          {/* Confirmed Appointments Tab */}
          {activeTab === 'confirmed' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmed Appointments</h2>
              {confirmedAppointments.length === 0 ? (
                <p className="text-gray-700 font-medium">No confirmed appointments yet.</p>
              ) : (
                <div className="space-y-4">
                  {confirmedAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <div key={appointment.id} className="border-2 border-green-300 rounded-lg p-5 bg-green-50">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{appointment.doctor.user.name}</h3>
                          <p className="text-sm text-gray-700 font-medium mt-1">
                            {appointment.doctor.specialization}
                          </p>
                          {appointment.doctor.user.contactNumber && (
                            <p className="text-sm text-gray-700 font-medium">{appointment.doctor.user.contactNumber}</p>
                          )}
                          <p className="text-sm text-gray-700 font-medium">{appointment.doctor.user.email}</p>
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize font-bold">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Status:</span>{' '}
                              <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded text-xs font-bold">
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending Appointments Tab */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Appointment Requests</h2>
              {pendingAppointments.length === 0 ? (
                <p className="text-gray-700 font-medium">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <div key={appointment.id} className="border-2 border-yellow-300 rounded-lg p-5 bg-yellow-50">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{appointment.doctor.user.name}</h3>
                          <p className="text-sm text-gray-700 font-medium mt-1">
                            {appointment.doctor.specialization}
                          </p>
                          {appointment.doctor.user.contactNumber && (
                            <p className="text-sm text-gray-700 font-medium">{appointment.doctor.user.contactNumber}</p>
                          )}
                          <p className="text-sm text-gray-700 font-medium">{appointment.doctor.user.email}</p>
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize font-bold">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              <span className="font-bold">Status:</span>{' '}
                              <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-bold">
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-700 font-medium">No notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((note) => (
                    <div
                      key={note.id}
                      className={`border border-gray-200 rounded-lg p-4 ${
                        note.read ? 'bg-white' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-sm text-gray-900 font-semibold">{note.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!note.read && (
                          <button
                            onClick={() => markNotificationRead(note.id)}
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      {!note.read && (
                        <span className="mt-2 inline-block px-2 py-0.5 text-xs rounded bg-blue-600 text-white font-bold">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

