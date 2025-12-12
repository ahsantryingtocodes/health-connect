'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'PATIENT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">Only patients can book appointments.</p>
          <a href="/profile" className="text-blue-600 hover:underline font-bold">Go to Profile</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-700">Book Appointment</h1>
            <a href="/profile" className="text-blue-600 hover:underline font-semibold">← Back to Profile</a>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Availability</label>
              <select
                value={availableToday}
                onChange={(e) => setAvailableToday(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">All Doctors</option>
                <option value="true">Available Today</option>
                <option value="false">Not Available Today</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Type</label>
              <select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="chat">Chat</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`mb-4 p-3 rounded-md ${status.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status}
            </div>
          )}

          {/* Doctors List */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Available Doctors</h2>
            {doctors.length === 0 ? (
              <p className="text-gray-600">No doctors found matching your criteria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-bold text-lg text-gray-800">{doctor.user.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                    <p className="text-xs text-gray-500 mt-1">{doctor.user.email}</p>
                    {doctor.user.contactNumber && (
                      <p className="text-xs text-gray-500">{doctor.user.contactNumber}</p>
                    )}
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        doctor.availableToday
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {doctor.availableToday ? 'Available Today' : 'Not Available Today'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointment Details */}
          {selectedDoctor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Appointment Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Selected Doctor:</p>
                  <p className="text-lg font-bold text-gray-900">{selectedDoctor.user.name} - {selectedDoctor.specialization}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Consultation Type:</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{consultationType}</p>
                </div>

                <button
                  onClick={handleBookAppointment}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-bold text-lg"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}