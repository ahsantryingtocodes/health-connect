'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PrescriptionModal from '@/components/PrescriptionModal';
import PrescriptionViewModal from '@/components/PrescriptionViewModal';
import { formatSpecialization } from '@/utils/specializations';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [ongoingAppointments, setOngoingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bannerNote, setBannerNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'upcoming' | 'ongoing' | 'completed' | 'notifications'
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState({});
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

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
    if (doctorProfile) {
      fetchPendingRequests();
      fetchUpcomingAppointments();
      fetchOngoingAppointments();
      fetchCompletedAppointments();
      fetchNotifications();
    }
  }, [doctorProfile]);

  // When notifications change, surface the newest unread as a banner
  useEffect(() => {
    const newestUnread = notifications.find((n) => !n.read);
    setBannerNote(newestUnread || null);
  }, [notifications]);

  // Check URL hash and switch to notifications tab if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#notifications') {
      setActiveTab('notifications');
    }
  }, []);

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

  const fetchCompletedAppointments = async () => {
    if (!doctorProfile) return;
    try {
      const res = await fetch(`/api/appointments/completed?doctorProfileId=${doctorProfile.id}`);
      const data = await res.json();
      if (res.ok) {
        setCompletedAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching completed appointments:', err);
    }
  };

  const fetchOngoingAppointments = async () => {
    if (!doctorProfile) return;
    try {
      const res = await fetch(`/api/appointments/ongoing?doctorProfileId=${doctorProfile.id}`);
      const data = await res.json();
      if (res.ok) {
        setOngoingAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching ongoing appointments:', err);
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

  const fetchPrescriptionForAppointment = async (appointmentId) => {
    try {
      const res = await fetch(`/api/prescriptions/appointment?appointmentId=${appointmentId}`);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions((prev) => ({ ...prev, [appointmentId]: data }));
      }
    } catch (err) {
      console.error('Error fetching prescription:', err);
    }
  };

  const handleViewPrescription = (appointment) => {
    const prescription = prescriptions[appointment.id];
    if (prescription) {
      setSelectedPrescription(prescription);
      setShowViewModal(true);
    }
  };

  // Fetch prescriptions for completed appointments
  useEffect(() => {
    if (completedAppointments.length > 0) {
      completedAppointments.forEach((appointment) => {
        fetchPrescriptionForAppointment(appointment.id);
      });
    }
  }, [completedAppointments]);

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

  const handleCreatePrescription = (appointment) => {
    // Enrich appointment with doctor user ID
    const enrichedAppointment = {
      ...appointment,
      doctorUserId: user?.id, // Add the logged-in doctor's user ID
    };
    setSelectedAppointment(enrichedAppointment);
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionSuccess = (message) => {
    setStatus(message);
    setShowPrescriptionModal(false);
    setSelectedAppointment(null);
    // Refresh appointments
    fetchOngoingAppointments();
    setTimeout(() => setStatus(''), 3000);
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!confirm('Mark this appointment as completed?')) return;

    try {
      const res = await fetch('/api/appointments/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      if (res.ok) {
        setStatus('Appointment marked as completed!');
        fetchOngoingAppointments();
        fetchCompletedAppointments();
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Failed to complete appointment');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setStatus('Error completing appointment');
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

  if (!user || user.role !== 'DOCTOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bg-white p-10 rounded-[24px] card-shadow text-center max-w-md"
        >
          <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-wide">Access Denied</h2>
          <p className="text-[#4a5568] mb-8">Only doctors can access this dashboard.</p>
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
    <div className="min-h-screen bg-[#F0F7FF] py-8 px-4 pt-24 text-[#0F2D52]">
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
              <h1 className="text-4xl font-bold text-[#0F2D52] tracking-wide">Doctor Dashboard</h1>
              {doctorProfile && (
                <p className="text-[#4a5568] mt-2 font-semibold">
                  {doctorProfile.user.name} - {formatSpecialization(doctorProfile.specialization)}
                </p>
              )}
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

          {/* Availability Toggle */}
          {doctorProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F0F7FF] border-2 border-[#F0F7FF] rounded-[20px] p-6 mb-8 card-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#0F2D52] text-lg">Availability Status</p>
                  <p className="text-sm text-[#4a5568] mt-1">
                    {doctorProfile.availableToday ? 'You are available today' : 'You are not available today'}
                  </p>
                </div>
                <motion.button
                  onClick={handleToggleAvailability}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-[20px] font-semibold transition-colors duration-300 shadow-lg ${doctorProfile.availableToday
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                >
                  {doctorProfile.availableToday ? 'Mark Unavailable' : 'Mark Available'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Status Message */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-[20px] ${status.includes('success') || status.includes('accepted') || status.includes('rejected')
                ? 'bg-green-50 text-green-700 border-2 border-green-200'
                : 'bg-red-50 text-red-700 border-2 border-red-200'
                }`}
            >
              {status}
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex border-b-2 border-[#F0F7FF] mb-8">
            <motion.button
              onClick={() => setActiveTab('requests')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${activeTab === 'requests'
                ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                : 'text-[#4a5568] hover:text-[#0F2D52]'
                }`}
            >
              Pending Requests ({pendingRequests.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('upcoming')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${activeTab === 'upcoming'
                ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                : 'text-[#4a5568] hover:text-[#0F2D52]'
                }`}
            >
              Upcoming Appointments ({upcomingAppointments.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('ongoing')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${activeTab === 'ongoing'
                ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                : 'text-[#4a5568] hover:text-[#0F2D52]'
                }`}
            >
              Ongoing ({ongoingAppointments.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('completed')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${activeTab === 'completed'
                ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                : 'text-[#4a5568] hover:text-[#0F2D52]'
                }`}
            >
              Completed ({completedAppointments.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('notifications')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 font-semibold transition-colors duration-300 rounded-t-[20px] ${activeTab === 'notifications'
                ? 'border-b-2 border-[#739AF0] text-[#739AF0] bg-[#F0F7FF]'
                : 'text-[#4a5568] hover:text-[#0F2D52]'
                }`}
            >
              Notifications ({notifications.length})
            </motion.button>
          </div>

          {/* Pending Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Pending Appointment Requests</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-[#4a5568]">No pending requests.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {pendingRequests.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-[#F0F7FF] rounded-[20px] p-6 bg-[#F0F7FF] card-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.patient.name}</h3>
                            <p className="text-sm text-[#4a5568] mt-1">{appointment.patient.email}</p>
                            {appointment.patient.contactNumber && (
                              <p className="text-sm text-[#4a5568]">{appointment.patient.contactNumber}</p>
                            )}
                            <div className="mt-4 space-y-2">
                              <p className="text-sm font-semibold text-[#0F2D52]">
                                <span className="font-bold">Date:</span> {dateStr}
                              </p>
                              <p className="text-sm font-semibold text-[#0F2D52]">
                                <span className="font-bold">Time:</span> {timeStr}
                              </p>
                              <p className="text-sm font-semibold text-[#0F2D52]">
                                <span className="font-bold">Type:</span>{' '}
                                <span className="capitalize">{appointment.consultationType}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 ml-4">
                            <motion.button
                              onClick={() => handleAppointmentDecision(appointment.id, 'ACCEPT')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-6 py-3 bg-green-500 text-white rounded-[20px] hover:bg-green-600 transition-colors duration-300 font-semibold shadow-lg"
                            >
                              Accept
                            </motion.button>
                            <motion.button
                              onClick={() => handleAppointmentDecision(appointment.id, 'REJECT')}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-6 py-3 bg-red-500 text-white rounded-[20px] hover:bg-red-600 transition-colors duration-300 font-semibold shadow-lg"
                            >
                              Decline
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Upcoming Appointments Tab */}
          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Upcoming Confirmed Appointments</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="text-[#4a5568]">No upcoming appointments.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {upcomingAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-[#739AF0] rounded-[20px] p-6 bg-[#F0F7FF] card-shadow"
                      >
                        <div>
                          <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.patient.name}</h3>
                          <p className="text-sm text-[#4a5568] mt-1">{appointment.patient.email}</p>
                          {appointment.patient.contactNumber && (
                            <p className="text-sm text-[#4a5568]">{appointment.patient.contactNumber}</p>
                          )}
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize">{appointment.consultationType}</span>
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

          {/* Completed Appointments Tab */}
          {activeTab === 'completed' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Completed Appointments</h2>
              {completedAppointments.length === 0 ? (
                <p className="text-[#4a5568]">No completed appointments yet.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {completedAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-gray-300 rounded-[20px] p-6 bg-gray-50 card-shadow"
                      >
                        <div>
                          <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.patient.name}</h3>
                          <p className="text-sm text-[#4a5568] mt-1">{appointment.patient.email}</p>
                          {appointment.patient.contactNumber && (
                            <p className="text-sm text-[#4a5568]">{appointment.patient.contactNumber}</p>
                          )}
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Status:</span>{' '}
                              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-bold">
                                COMPLETED
                              </span>
                            </p>
                          </div>
                          {/* View Prescription Button */}
                          {prescriptions[appointment.id] && prescriptions[appointment.id].status === 'SENT' && (
                            <div className="mt-4">
                              <motion.button
                                onClick={() => handleViewPrescription(appointment)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full px-6 py-3 bg-blue-500 text-white rounded-[20px] hover:bg-blue-600 font-semibold shadow-lg"
                              >
                                📄 View Prescription
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Ongoing Appointments Tab */}
          {activeTab === 'ongoing' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Ongoing Appointments</h2>
              {ongoingAppointments.length === 0 ? (
                <p className="text-[#4a5568]">No ongoing appointments at the moment.</p>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {ongoingAppointments.map((appointment) => {
                    const { date: dateStr, time: timeStr } = formatDateTime(appointment.date);
                    return (
                      <motion.div
                        key={appointment.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                        className="border-2 border-orange-400 rounded-[20px] p-6 bg-orange-50 card-shadow relative"
                      >
                        <div className="absolute top-4 right-4">
                          <span className="inline-block px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold animate-pulse">
                            IN PROGRESS
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-[#0F2D52]">{appointment.patient.name}</h3>
                          <p className="text-sm text-[#4a5568] mt-1">{appointment.patient.email}</p>
                          {appointment.patient.contactNumber && (
                            <p className="text-sm text-[#4a5568]">{appointment.patient.contactNumber}</p>
                          )}
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Date:</span> {dateStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Time:</span> {timeStr}
                            </p>
                            <p className="text-sm font-semibold text-[#0F2D52]">
                              <span className="font-bold">Type:</span>{' '}
                              <span className="capitalize">{appointment.consultationType}</span>
                            </p>
                            <p className="text-sm font-semibold text-orange-600">
                              <span className="font-bold">⏱️ Appointment window:</span> {timeStr} - {new Date(new Date(appointment.date).getTime() + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="mt-4 space-y-3">
                            <motion.button
                              onClick={() => handleCreatePrescription(appointment)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold shadow-lg"
                            >
                              📝 Create Prescription
                            </motion.button>
                            <motion.button
                              onClick={() => handleCompleteAppointment(appointment.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full px-6 py-3 bg-green-500 text-white rounded-[20px] hover:bg-green-600 font-semibold shadow-lg"
                            >
                              ✓ Mark as Done
                            </motion.button>
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
                <p className="text-[#4a5568]">No notifications.</p>
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
                      className={`border-2 rounded-[20px] p-5 ${note.read ? 'bg-white border-[#F0F7FF]' : 'bg-[#F0F7FF] border-[#739AF0]'
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

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          appointment={selectedAppointment}
          onSuccess={handlePrescriptionSuccess}
        />
      )}

      {/* Prescription View Modal */}
      {showViewModal && selectedPrescription && (
        <PrescriptionViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPrescription(null);
          }}
          prescription={selectedPrescription}
        />
      )}
    </div>
  );
}
