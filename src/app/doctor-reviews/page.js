'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReviewsList from '@/components/ReviewsList';

export default function DoctorReviewsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            router.push('/login');
            return;
        }

        fetchUserProfile(userEmail);
    }, []);

    const fetchUserProfile = async (email) => {
        try {
            const res = await fetch(`/api/profile?email=${email}`);
            const data = await res.json();
            if (res.ok) {
                if (data.role !== 'DOCTOR') {
                    router.push('/');
                    return;
                }
                setUser(data);
                fetchStats(data.id);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchStats = async (doctorId) => {
        try {
            const res = await fetch(`/api/reviews/stats?doctorId=${doctorId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-500 text-3xl">
                        {star <= Math.round(rating) ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] to-white flex items-center justify-center">
                <p className="text-[#0F2D52] text-xl font-semibold">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] to-white p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/doctor-dashboard')}
                        className="text-[#739AF0] hover:text-[#5a7bc0] font-semibold mb-4"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-[#0F2D52]">My Reviews</h1>
                    <p className="text-[#4a5568] mt-2">See what your patients are saying</p>
                </div>

                {/* Stats Section */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Average Rating */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[24px] p-6 card-shadow text-center"
                        >
                            <p className="text-sm font-semibold text-[#4a5568] mb-2">Average Rating</p>
                            <div className="flex justify-center mb-2">
                                {renderStars(stats.averageRating)}
                            </div>
                            <p className="text-4xl font-bold text-[#0F2D52]">{stats.averageRating.toFixed(1)}</p>
                        </motion.div>

                        {/* Total Reviews */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[24px] p-6 card-shadow text-center"
                        >
                            <p className="text-sm font-semibold text-[#4a5568] mb-2">Total Reviews</p>
                            <p className="text-5xl font-bold text-[#739AF0] mt-4">{stats.totalReviews}</p>
                        </motion.div>

                        {/* Rating Distribution */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[24px] p-6 card-shadow"
                        >
                            <p className="text-sm font-semibold text-[#4a5568] mb-3">Rating Distribution</p>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <div key={rating} className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#0F2D52] w-8">{rating}⭐</span>
                                        <div className="flex-1 bg-[#F0F7FF] rounded-full h-2">
                                            <div
                                                className="bg-[#739AF0] h-2 rounded-full"
                                                style={{
                                                    width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm text-[#4a5568] w-8">{stats.ratingDistribution[rating]}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Reviews List */}
                <div className="bg-white rounded-[24px] p-8 card-shadow">
                    <h2 className="text-2xl font-bold text-[#0F2D52] mb-6">All Reviews</h2>
                    {user && <ReviewsList doctorId={user.id} isDoctor={true} />}
                </div>
            </div>
        </div>
    );
}
