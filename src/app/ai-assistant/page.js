'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSpecialization } from '@/utils/specializations';

export default function AIAssistantPage() {
    const router = useRouter();
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [specializedDoctors, setSpecializedDoctors] = useState([]);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setRecommendation(null);
        setSpecializedDoctors([]);

        try {
            const res = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms }),
            });

            const data = await res.json();

            if (res.ok) {
                setRecommendation(data.recommendation);
                setSpecializedDoctors(data.doctors);
            } else {
                setError(data.message || 'Failed to analyze symptoms');
            }
        } catch (err) {
            setError('Error connecting to AI service. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-500 text-sm">
                        {star <= Math.round(rating) ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F7FF] to-white py-8 px-4 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl font-bold text-[#0F2D52] mb-3">🤖 AI Health Assistant</h1>
                    <p className="text-[#4a5568] text-lg">Describe your symptoms and get personalized recommendations</p>
                    <div className="mt-4 inline-block bg-yellow-50 border-2 border-yellow-200 rounded-[20px] px-6 py-3">
                        <p className="text-sm text-yellow-800 font-semibold">
                            ⚠️ This is an AI assistant and not a substitute for professional medical advice
                        </p>
                    </div>
                </motion.div>

                {/* Symptom Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
                    className="bg-white rounded-[24px] card-shadow p-8 mb-8"
                >
                    <h2 className="text-2xl font-bold text-[#0F2D52] mb-6">Tell us about your symptoms</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">
                                Describe your symptoms in detail
                            </label>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="e.g., I have been experiencing fever, cough, and fatigue for the past 3 days..."
                                className="w-full p-4 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300 min-h-[150px]"
                                required
                            />
                            <p className="text-xs text-[#4a5568] mt-2">
                                💡 Tip: Include details like duration, severity, and any other relevant information
                            </p>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full bg-[#739AF0] text-white py-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 disabled:bg-[#a0b5f0] disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">🔄</span> Analyzing symptoms...
                                </span>
                            ) : (
                                '🔍 Get AI Recommendation'
                            )}
                        </motion.button>
                    </form>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-[20px] text-red-700"
                        >
                            {error}
                        </motion.div>
                    )}
                </motion.div>

                {/* Recommendation Results */}
                <AnimatePresence>
                    {recommendation && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="space-y-6"
                        >
                            {/* AI Recommendation */}
                            <div className="bg-white rounded-[24px] card-shadow p-8">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 bg-[#739AF0] rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🤖</span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-[#0F2D52] mb-2">AI Analysis</h2>
                                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                            recommendation.urgency === 'moderate' ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {recommendation.urgency === 'high' ? '🚨 High Priority' :
                                                recommendation.urgency === 'moderate' ? '⚠️ Moderate Priority' :
                                                    '✅ Low Priority'}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F0F7FF] rounded-[20px] p-6 mb-4">
                                    <h3 className="text-lg font-bold text-[#0F2D52] mb-2">{recommendation.condition}</h3>
                                    <p className="text-[#4a5568] whitespace-pre-wrap leading-relaxed">{recommendation.treatment}</p>
                                </div>

                                <div className="bg-blue-50 border-2 border-blue-200 rounded-[20px] p-4">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-bold">💡 Recommended Specialist:</span> We've found doctors who specialize in this area below.
                                    </p>
                                </div>
                            </div>

                            {/* Specialized Doctors List */}
                            <div className="bg-white rounded-[24px] card-shadow p-8">
                                <h2 className="text-2xl font-bold text-[#0F2D52] mb-6">👨‍⚕️ Recommended Doctors</h2>

                                {specializedDoctors.length === 0 ? (
                                    <p className="text-[#4a5568] text-center py-8">No doctors found for this specialization</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {specializedDoctors.map((doctor, index) => (
                                            <motion.div
                                                key={doctor.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                whileHover={{ y: -5 }}
                                                className="bg-[#F0F7FF] rounded-[20px] p-6 border-2 border-[#739AF0] card-shadow"
                                            >
                                                {/* Doctor Avatar */}
                                                <div className="w-16 h-16 bg-[#739AF0] rounded-full mx-auto mb-3 flex items-center justify-center">
                                                    <span className="text-white text-2xl font-bold">
                                                        {doctor.name.split(' ')[1].charAt(0)}
                                                    </span>
                                                </div>

                                                {/* Doctor Info */}
                                                <h3 className="text-lg font-bold text-[#0F2D52] text-center mb-1">
                                                    {doctor.name}
                                                </h3>
                                                <p className="text-sm text-[#4a5568] text-center mb-3">
                                                    {formatSpecialization(doctor.specialization)}
                                                </p>

                                                {/* Rating */}
                                                <div className="flex justify-center items-center gap-2 mb-3">
                                                    {renderStars(doctor.rating)}
                                                    <span className="text-sm font-semibold text-[#0F2D52]">
                                                        {doctor.rating}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#4a5568] text-center mb-4">
                                                    ({doctor.reviews} reviews)
                                                </p>

                                                {/* Availability */}
                                                <div className={`text-center py-2 rounded-[15px] mb-4 ${doctor.availableToday
                                                    ? 'bg-green-50 text-green-700 border-2 border-green-200'
                                                    : 'bg-gray-50 text-gray-600 border-2 border-gray-200'
                                                    }`}>
                                                    <p className="text-xs font-semibold">
                                                        {doctor.availableToday ? '✓ Available Today' : 'Not Available'}
                                                    </p>
                                                </div>

                                                {/* Book Button */}
                                                <motion.button
                                                    onClick={() => router.push('/book-appointment')}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="w-full px-4 py-3 bg-[#739AF0] text-white rounded-[15px] hover:bg-[#5a7bc0] font-semibold text-sm shadow-lg"
                                                >
                                                    Book Appointment
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* View All Doctors Button */}
                                <motion.button
                                    onClick={() => router.push('/find-doctors')}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full mt-6 px-6 py-4 bg-white border-2 border-[#739AF0] text-[#739AF0] rounded-[20px] hover:bg-[#F0F7FF] font-semibold shadow-lg"
                                >
                                    View All Doctors
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
