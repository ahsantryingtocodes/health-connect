'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bannerNote, setBannerNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'upcoming' | 'notifications'

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      router.push('/login');
      return;
    }

    fetchUserProfile(userEmail);
  }, [router]);

  useEffect(() => {
    if (doctorProfile) {
      fetchPendingRequests();
      fetchUpcomingAppointments();
      fetchNotifications();
    }
  }, [doctorProfile]);

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
        if (data.role !== 'DOCTOR') {
          setStatus('Only doctors can access this dashboard');
        } else {
          if (data.doctorProfile) {
            setDoctorProfile(data.doctorProfile);
          } else {
            setStatus('Doctor profile not found');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    if (!doctorProfile) return;
    try {
      const res = await fetch(`/api/appointments/requests?doctorProfileId=${doctorProfile.id}`);
      const data = await res.json();
      if (res.ok) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const fetchUpcomingAppointments = async () => {
    if (!doctorProfile) return;
    try {
      const res = await fetch(`/api/appointments/upcoming?doctorProfileId=${doctorProfile.id}`);
      const data = await res.json();
      if (res.ok) {
        setUpcomingAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching upcoming appointments:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!doctorProfile?.user?.email) return;
    try {
      const res = await fetch(`/api/notifications?email=${doctorProfile.user.email}`);
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
        body: JSON.stringify({ email: doctorProfile?.user?.email, read: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleAppointmentDecision = async (appointmentId, action) => {
    try {
      setStatus(`Processing ${action.toLowerCase()}...`);
      const res = await fetch('/api/appointments/decision', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`Appointment ${action === 'ACCEPT' ? 'accepted' : 'rejected'} successfully!`);
        fetchPendingRequests();
        fetchUpcomingAppointments();
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(data.message || 'Failed to process request');
      }
    } catch (err) {
      setStatus('Error processing request');
      console.error(err);
    }
  };

  const handleToggleAvailability = async () => {
    if (!doctorProfile) return;
    try {
      setStatus('Updating availability...');
      const res = await fetch('/api/doctor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorProfileId: doctorProfile.id,
          availableToday: !doctorProfile.availableToday,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setDoctorProfile({ ...doctorProfile, availableToday: !doctorProfile.availableToday });
        setStatus('Availability updated successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(data.message || 'Failed to update availability');
      }
    } catch (err) {
      setStatus('Error updating availability');
      console.error(err);
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'DOCTOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">Only doctors can access this dashboard.</p>
          <a href="/profile" className="text-blue-600 hover:underline font-bold">Go to Profile</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-900">
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
              <h1 className="text-3xl font-bold text-blue-800">Doctor Dashboard</h1>
              {doctorProfile && (
                <p className="text-gray-800 mt-1">
                  {doctorProfile.user.name} - {doctorProfile.specialization}
                </p>
              )}
            </div>
            <a href="/profile" className="text-blue-700 hover:underline font-semibold">← Back to Profile</a>
          </div>

          {/* Availability Toggle */}
          {doctorProfile && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Availability Status</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {doctorProfile.availableToday ? 'You are available today' : 'You are not available today'}
                  </p>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  className={`px-6 py-2 rounded-md font-bold transition ${
                    doctorProfile.availableToday
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {doctorProfile.availableToday ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`mb-4 p-3 rounded-md ${
              status.includes('success') || status.includes('accepted') || status.includes('rejected')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {status}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-bold transition ${
                activeTab === 'requests'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pending Requests ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 font-bold transition ${
                activeTab === 'upcoming'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Upcoming Appointments ({upcomingAppointments.length})
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

          {/* Pending Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Appointment Requests</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-600">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">{appointment.patient.name}</h3>
                            <p className="text-sm text-gray-800 mt-1">{appointment.patient.email}</p>
                            {appointment.patient.contactNumber && (
                              <p className="text-sm text-gray-800">{appointment.patient.contactNumber}</p>
                            )}
                            <div className="mt-3 space-y-1">
                              <p className="text-sm">
                                <span className="font-semibold">Date:</span> {dateStr}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold">Time:</span> {timeStr}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold">Type:</span>{' '}
                                <span className="capitalize">{appointment.consultationType}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleAppointmentDecision(appointment.id, 'ACCEPT')}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAppointmentDecision(appointment.id, 'REJECT')}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-bold"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Appointments Tab */}
          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Confirmed Appointments</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-600">No upcoming appointments.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{appointment.patient.name}</h3>
                          <p className="text-sm text-gray-800 mt-1">{appointment.patient.email}</p>
                          {appointment.patient.contactNumber && (
                            <p className="text-sm text-gray-800">{appointment.patient.contactNumber}</p>
                          )}
                          <div className="mt-3 space-y-1">
                            <p className="text-sm">
                              <span className="font-semibold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Type:</span>{' '}
                              <span className="capitalize">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Status:</span>{' '}
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
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
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-600">No notifications.</p>
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

