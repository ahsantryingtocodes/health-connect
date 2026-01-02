'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewModal({ isOpen, onClose, appointment, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctor?.user?.id || appointment.doctor?.userId,
                    rating,
                    comment: comment.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }

            onSuccess('Review submitted successfully!');
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[24px] p-8 max-w-lg w-full card-shadow"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[#0F2D52]">Leave a Review</h2>
                        <button
                            onClick={onClose}
                            className="text-[#4a5568] hover:text-[#0F2D52] text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-[20px] text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Doctor Info */}
                        <div className="p-4 bg-[#F0F7FF] rounded-[20px]">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                                Doctor: Dr. {appointment.doctor?.user?.name || appointment.doctor?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-[#4a5568] mt-1">
                                {new Date(appointment.date).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Star Rating */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F2D52] mb-3">
                                Rating <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-4xl focus:outline-none"
                                    >
                                        {star <= (hoveredRating || rating) ? '⭐' : '☆'}
                                    </motion.button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-sm text-[#4a5568] mt-2">
                                    {rating === 5 && 'Excellent!'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 3 && 'Good'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 1 && 'Poor'}
                                </p>
                            )}
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F2D52] mb-2">
                                Comment (Optional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={500}
                                rows="4"
                                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:border-[#739AF0] focus:outline-none resize-none"
                                placeholder="Share your experience with this doctor..."
                            />
                            <p className="text-xs text-[#4a5568] mt-1 text-right">
                                {comment.length}/500 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <motion.button
                                onClick={handleSubmit}
                                disabled={loading || rating === 0}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Review'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
