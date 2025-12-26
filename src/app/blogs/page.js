'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BlogViewModal from '@/components/BlogViewModal';

export default function BlogsPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Get user role from localStorage
        const role = localStorage.getItem('userRole');
        setUserRole(role);

        // Fetch blogs
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await fetch('/api/blog');
            if (res.ok) {
                const data = await res.json();
                setBlogs(data);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const canCreateBlog = userRole === 'DOCTOR' || userRole === 'ADMIN';

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 bg-gradient-to-br from-[#F0F7FF] via-white to-[#E8F4FF]">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0F2D52] mb-4">
                        Health Blog
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Expert insights and health tips from our medical professionals
                    </p>

                    {/* Create New Blog Button - Only for Doctors and Admins */}
                    {canCreateBlog && (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/blogs/new"
                                className="inline-block px-8 py-3 bg-[#739AF0] text-white rounded-full font-semibold hover:bg-[#5a7dd0] transition-colors duration-300 shadow-lg"
                            >
                                ✍️ Create New Blog
                            </Link>
                        </motion.div>
                    )}
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#739AF0]"></div>
                        <p className="mt-4 text-gray-600">Loading blogs...</p>
                    </div>
                )}

                {/* No Blogs State */}
                {!loading && blogs.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            No blogs to show
                        </h2>
                        <p className="text-gray-500">
                            {canCreateBlog
                                ? 'Be the first to share your medical insights!'
                                : 'Check back later for expert health articles.'}
                        </p>
                    </motion.div>
                )}

                {/* Blogs Grid */}
                {!loading && blogs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog, index) => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                                {/* Blog Header */}
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-[#0F2D52] mb-2 line-clamp-2">
                                        {blog.title}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <span className="font-semibold">{blog.authorName}</span>
                                        {blog.specialization && (
                                            <>
                                                <span>•</span>
                                                <span className="text-[#739AF0]">
                                                    {blog.specialization.replace(/_/g, ' ')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(blog.createdAt)}
                                    </div>
                                </div>

                                {/* Blog Content Preview */}
                                <p className="text-gray-700 line-clamp-4 mb-4">
                                    {blog.content}
                                </p>

                                {/* Read More Button */}
                                <button
                                    onClick={() => {
                                        setSelectedBlog(blog);
                                        setIsModalOpen(true);
                                    }}
                                    className="text-[#739AF0] font-semibold hover:text-[#5a7dd0] transition-colors duration-300 text-sm"
                                >
                                    Read More →
                                </button>

                                {/* Role Badge */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${blog.authorRole === 'DOCTOR'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}
                                    >
                                        {blog.authorRole}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Blog View Modal */}
            <BlogViewModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedBlog(null);
                }}
                blog={selectedBlog}
            />
        </div>
    );
}
