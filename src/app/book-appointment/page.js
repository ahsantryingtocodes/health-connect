'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [specialization, setSpecialization] = useState('');
  const [availableToday, setAvailableToday] = useState('');
  const [consultationType, setConsultationType] = useState('chat');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setLoading(false);
      router.push('/login');
      return;
    }

    fetchUserProfile(userEmail);
    fetchDoctors();
  }, [router]);

  useEffect(() => {
    if (specialization || availableToday) {
      fetchDoctors();
    } else {
      fetchDoctors();
    }
  }, [specialization, availableToday]);

  const fetchUserProfile = async (email) => {
    try {
      const res = await fetch(`/api/profile?email=${email}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        if (data.role !== 'PATIENT') {
          setStatus('Only patients can book appointments');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (specialization) params.append('specialization', specialization);
      if (availableToday) params.append('availableToday', availableToday);

      const res = await fetch(`/api/find_doctor?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setDoctors(data);
        // Extract unique specializations
        const uniqueSpecs = [...new Set(data.map(d => d.specialization))];
        setSpecializations(uniqueSpecs);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setStatus('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !date || !time) {
      setStatus('Please select a doctor, date, and time');
      return;
    }

    if (!user || user.role !== 'PATIENT') {
      setStatus('Only patients can book appointments');
      return;
    }

    try {
      setStatus('Booking appointment...');
      const appointmentDateTime = new Date(`${date}T${time}`);
      
      const res = await fetch('/api/create_appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          doctorProfileId: selectedDoctor.id,
          consultationType: consultationType,
          date: appointmentDateTime.toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('Appointment booked successfully!');
        setSelectedDoctor(null);
        setDate('');
        setTime('');
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        setStatus(data.message || 'Failed to book appointment');
      }
    } catch (err) {
      setStatus('Error booking appointment');
      console.error(err);
    }
  };

  if (loading && !user) {
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
          <p className="text-[#4a5568] mb-8">Only patients can book appointments.</p>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#0F2D52] tracking-wide">Book Appointment</h1>
            <motion.a
              href="/profile"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#739AF0] hover:underline font-semibold"
            >
              ← Back to Profile
            </motion.a>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Availability</label>
              <select
                value={availableToday}
                onChange={(e) => setAvailableToday(e.target.value)}
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              >
                <option value="">All Doctors</option>
                <option value="true">Available Today</option>
                <option value="false">Not Available Today</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Consultation Type</label>
              <select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
              >
                <option value="chat">Chat</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-[20px] ${
                status.includes('success') 
                  ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                  : 'bg-red-50 text-red-700 border-2 border-red-200'
              }`}
            >
              {status}
            </motion.div>
          )}

          {/* Doctors List */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Available Doctors</h2>
            {loading ? (
              <p className="text-[#4a5568]">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="text-[#4a5568]">No doctors found matching your criteria.</p>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {doctors.map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    variants={itemVariants}
                    onClick={() => setSelectedDoctor(doctor)}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 border-2 rounded-[20px] cursor-pointer transition-all duration-300 card-shadow ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-[#739AF0] bg-[#F0F7FF]'
                        : 'border-[#F0F7FF] hover:border-[#739AF0] bg-white'
                    }`}
                  >
                    <h3 className="font-bold text-xl text-[#0F2D52]">{doctor.user.name}</h3>
                    <p className="text-sm text-[#4a5568] mt-2 font-medium">{doctor.specialization}</p>
                    <p className="text-xs text-[#4a5568] mt-1">{doctor.user.email}</p>
                    {doctor.user.contactNumber && (
                      <p className="text-xs text-[#4a5568] mt-1">{doctor.user.contactNumber}</p>
                    )}
                    <div className="mt-4">
                      <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                        doctor.availableToday
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {doctor.availableToday ? 'Available Today' : 'Not Available Today'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Appointment Details */}
          {selectedDoctor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F0F7FF] border-2 border-[#739AF0] rounded-[24px] p-8 card-shadow"
            >
              <h2 className="text-2xl font-bold text-[#0F2D52] mb-6 tracking-wide">Appointment Details</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-[#4a5568] mb-1">Selected Doctor:</p>
                  <p className="text-xl font-bold text-[#0F2D52]">{selectedDoctor.user.name} - {selectedDoctor.specialization}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0F2D52] mb-2">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#4a5568] mb-2">Consultation Type:</p>
                  <p className="text-lg font-bold text-[#0F2D52] capitalize">{consultationType}</p>
                </div>

                <motion.button
                  onClick={handleBookAppointment}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="w-full bg-[#739AF0] text-white py-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 font-semibold text-lg shadow-lg"
                >
                  Book Appointment
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
