'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] pt-24">
        <div className="text-[#0F2D52] font-bold text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'PATIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bg-white p-10 rounded-[24px] card-shadow text-center max-w-md"
        >
          <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-wide">Access Denied</h2>
          <p className="text-[#0F2D52] font-semibold mb-8">Only patients can access this dashboard.</p>
          <a href="/profile" className="text-[#739AF0] hover:underline font-semibold">Go to Profile</a>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] py-8 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bg-white rounded-[24px] card-shadow p-8 mb-6"
        >
          {/* Unread Notification Banner */}
          {bannerNote && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-5 rounded-[20px] bg-yellow-50 border-2 border-yellow-200 text-[#0F2D52] flex justify-between items-start"
            >
              <div>
                <p className="font-bold text-sm text-yellow-900">New notification</p>
                <p className="text-sm mt-1 text-[#4a5568]">{bannerNote.message}</p>
                <p className="text-xs text-[#4a5568] mt-1">
                  {new Date(bannerNote.createdAt).toLocaleString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => markNotificationRead(bannerNote.id)}
                className="text-xs font-semibold text-[#739AF0] hover:underline ml-3"
              >
                Mark as read
              </motion.button>
            </motion.div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#0F2D52] tracking-wide">My Appointments</h1>
              <p className="text-[#4a5568] font-semibold mt-2">Welcome, {user.name}</p>
            </div>
            <motion.a
              href="/profile"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#739AF0] hover:underline font-semibold"
            >
              ← Back to Profile
            </motion.a>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-[#F0F7FF] mb-8">
            <motion.button
              onClick={() => setActiveTab('confirmed')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${
                activeTab === 'confirmed'
                  ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                  : 'text-[#4a5568] hover:text-[#0F2D52]'
              }`}
            >
              Confirmed Appointments ({confirmedAppointments.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('pending')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${
                activeTab === 'pending'
                  ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                  : 'text-[#4a5568] hover:text-[#0F2D52]'
              }`}
            >
              Pending Requests ({pendingAppointments.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('notifications')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                  : 'text-[#4a5568] hover:text-[#0F2D52]'
              }`}
            >
              Notifications ({notifications.length})
            </motion.button>
          </div>

          {/* Confirmed Appointments Tab */}
          {activeTab === 'confirmed' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Confirmed Appointments</h2>
              {confirmedAppointments.length === 0 ? (
                <p className="text-[#4a5568] font-medium">No confirmed appointments yet.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {confirmedAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-green-300 rounded-[20px] p-6 bg-green-50 card-shadow"
                      >
                        <div>
                          <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.doctor.user.name}</h3>
                          <p className="text-sm text-[#4a5568] font-medium mt-1">
                            {appointment.doctor.specialization}
                          </p>
                          {appointment.doctor.user.contactNumber && (
                            <p className="text-sm text-[#4a5568] font-medium">{appointment.doctor.user.contactNumber}</p>
                          )}
                          <p className="text-sm text-[#4a5568] font-medium">{appointment.doctor.user.email}</p>
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize font-bold">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Status:</span>{' '}
                              <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Pending Appointments Tab */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Pending Appointment Requests</h2>
              {pendingAppointments.length === 0 ? (
                <p className="text-[#4a5568] font-medium">No pending requests.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {pendingAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-yellow-300 rounded-[20px] p-6 bg-yellow-50 card-shadow"
                      >
                        <div>
                          <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.doctor.user.name}</h3>
                          <p className="text-sm text-[#4a5568] font-medium mt-1">
                            {appointment.doctor.specialization}
                          </p>
                          {appointment.doctor.user.contactNumber && (
                            <p className="text-sm text-[#4a5568] font-medium">{appointment.doctor.user.contactNumber}</p>
                          )}
                          <p className="text-sm text-[#4a5568] font-medium">{appointment.doctor.user.email}</p>
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize font-bold">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Status:</span>{' '}
                              <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                                {appointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#0F2D52] tracking-wide">Notifications</h2>
                <motion.button
                  onClick={markAllNotificationsRead}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-semibold text-[#739AF0] hover:underline"
                >
                  Mark all as read
                </motion.button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-[#4a5568] font-medium">No notifications.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {notifications.map((note) => (
                    <motion.div
                      key={note.id}
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className={`border-2 rounded-[20px] p-5 ${
                        note.read ? 'bg-white border-[#F0F7FF]' : 'bg-[#F0F7FF] border-[#739AF0]'
                      } card-shadow`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-sm text-[#0F2D52] font-semibold">{note.message}</p>
                          <p className="text-xs text-[#4a5568] mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!note.read && (
                          <motion.button
                            onClick={() => markNotificationRead(note.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs font-semibold text-[#739AF0] hover:underline"
                          >
                            Mark read
                          </motion.button>
                        )}
                      </div>
                      {!note.read && (
                        <span className="mt-3 inline-block px-3 py-1 text-xs rounded-full bg-[#739AF0] text-white font-bold">
                          New
                        </span>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
