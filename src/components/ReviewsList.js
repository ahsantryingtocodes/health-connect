'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ReviewsList({ doctorId, isDoctor = false }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 10;

    useEffect(() => {
        fetchReviews();
    }, [doctorId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?doctorId=${doctorId}&isDoctor=${isDoctor}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-500 text-lg">
                        {star <= rating ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return <p className="text-[#4a5568]">Loading reviews...</p>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-[#4a5568] text-lg">No reviews yet</p>
                <p className="text-[#4a5568] text-sm mt-2">Reviews from patients will appear here</p>
            </div>
        );
    }

    // Pagination
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    return (
        <div className="space-y-4">
            {currentReviews.map((review) => (
                <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#F0F7FF] rounded-[20px] p-6 card-shadow"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="font-semibold text-[#0F2D52]">{review.patient.name}</p>
                            <p className="text-xs text-[#4a5568] mt-1">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        {renderStars(review.rating)}
                    </div>

                    {review.comment && (
                        <p className="text-sm text-[#4a5568] mt-3 whitespace-pre-wrap">{review.comment}</p>
                    )}
                </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-[#F0F7FF] text-[#0F2D52] rounded-[15px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-[#0F2D52] font-semibold">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-[#F0F7FF] text-[#0F2D52] rounded-[15px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
