'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatSpecialization } from '@/utils/specializations';

export default function FindDoctorsPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await fetch('/api/doctors');
            if (res.ok) {
                const data = await res.json();
                // Fetch ratings for each doctor
                const doctorsWithRatings = await Promise.all(
                    data.map(async (doctor) => {
                        const statsRes = await fetch(`/api/reviews/stats?doctorId=${doctor.user.id}`);
                        const stats = statsRes.ok ? await statsRes.json() : { averageRating: 0, totalReviews: 0 };
                        return { ...doctor, stats };
                    })
                );
                setDoctors(doctorsWithRatings);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-500 text-lg">
                        {star <= Math.round(rating) ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] to-white flex items-center justify-center pt-24">
                <p className="text-[#0F2D52] text-xl font-semibold">Loading doctors...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] to-white p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0F2D52]">Find Doctors</h1>
                    <p className="text-[#4a5568] mt-2">Browse all doctors and their ratings</p>
                </div>

                {/* Doctors Grid */}
                {doctors.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[#4a5568] text-lg">No doctors available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => (
                            <motion.div
                                key={doctor.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-[24px] p-6 card-shadow"
                            >
                                {/* Doctor Info */}
                                <div className="text-center mb-4">
                                    <div className="w-20 h-20 bg-[#739AF0] rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <span className="text-white text-3xl font-bold">
                                            {doctor.user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0F2D52]">
                                        {doctor.user.name}
                                    </h3>
                                    <p className="text-sm text-[#4a5568] mt-1">{formatSpecialization(doctor.specialization)}</p>
                                </div>

                                {/* Rating */}
                                <div className="border-t-2 border-[#F0F7FF] pt-4">
                                    {doctor.stats.totalReviews > 0 ? (
                                        <>
                                            <div className="flex justify-center mb-2">
                                                {renderStars(doctor.stats.averageRating)}
                                            </div>
                                            <p className="text-center text-sm font-semibold text-[#0F2D52]">
                                                {doctor.stats.averageRating.toFixed(1)} / 5.0
                                            </p>
                                            <p className="text-center text-xs text-[#4a5568] mt-1">
                                                ({doctor.stats.totalReviews} {doctor.stats.totalReviews === 1 ? 'review' : 'reviews'})
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-center text-sm text-[#4a5568]">No reviews yet</p>
                                    )}
                                </div>

                                {/* Availability */}
                                <div className="mt-4">
                                    <div className={`text-center py-2 rounded-[15px] ${doctor.availableToday
                                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                                        : 'bg-gray-50 text-gray-600 border-2 border-gray-200'
                                        }`}>
                                        <p className="text-xs font-semibold">
                                            {doctor.availableToday ? '✓ Available Today' : 'Not Available'}
                                        </p>
                                    </div>
                                </div>

                                {/* Book Button */}
                                <motion.button
                                    onClick={() => router.push('/book-appointment')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full mt-4 px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold shadow-lg"
                                >
                                    Book Appointment
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
