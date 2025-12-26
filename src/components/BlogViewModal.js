'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function BlogViewModal({ isOpen, onClose, blog }) {
    if (!isOpen || !blog) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[24px] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto card-shadow"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#F0F7FF]">
                        <div className="flex-1 pr-4">
                            <h2 className="text-3xl font-bold text-[#0F2D52] mb-2">
                                {blog.title}
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${blog.authorRole === 'DOCTOR'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-purple-100 text-purple-700'
                                        }`}
                                >
                                    {blog.authorRole}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {formatDate(blog.createdAt)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#4a5568] hover:text-[#0F2D52] text-3xl font-bold flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Author Information */}
                        <div className="bg-[#F0F7FF] rounded-[20px] p-5">
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">
                                Author Information
                            </h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Name:</span>{' '}
                                    <span className="text-[#4a5568]">{blog.authorName}</span>
                                </p>
                                {blog.specialization && (
                                    <p className="text-sm">
                                        <span className="font-semibold text-[#0F2D52]">
                                            Specialization:
                                        </span>{' '}
                                        <span className="text-[#4a5568]">
                                            {blog.specialization.replace(/_/g, ' ')}
                                        </span>
                                    </p>
                                )}
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Role:</span>{' '}
                                    <span className="text-[#4a5568]">{blog.authorRole}</span>
                                </p>
                            </div>
                        </div>

                        {/* Blog Content */}
                        <div>
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">
                                Article Content
                            </h3>
                            <div className="bg-white border-2 border-[#F0F7FF] rounded-[20px] p-6">
                                <p className="text-base text-[#4a5568] whitespace-pre-wrap leading-relaxed">
                                    {blog.content}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t-2 border-[#F0F7FF]">
                            <p className="text-xs text-[#4a5568] text-center">
                                This article is provided by Health Connect for informational purposes.
                            </p>
                            <p className="text-xs text-[#4a5568] text-center mt-1">
                                Please consult your doctor for personalized medical advice.
                            </p>
                        </div>

                        {/* Close Button */}
                        <div className="pt-2">
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold transition-colors duration-300"
                            >
                                Close
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
