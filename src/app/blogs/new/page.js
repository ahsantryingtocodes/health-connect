'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function NewBlogPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        authorName: '',
        specialization: '',
        content: '',
    });

    const specializations = [
        'CARDIOLOGY',
        'DERMATOLOGY',
        'PEDIATRICS',
        'NEUROLOGY',
        'ORTHOPEDICS',
        'PSYCHIATRY',
        'GENERAL_PRACTICE',
        'ONCOLOGY',
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            // Check user role and redirect if patient
            const role = localStorage.getItem('userRole');
            const email = localStorage.getItem('userEmail');

            setUserRole(role);

            if (role === 'PATIENT') {
                alert('Only doctors and admins can create blog posts.');
                router.push('/blogs');
                return;
            }

            if (!role || !email) {
                alert('Please login to create a blog post.');
                router.push('/login');
                return;
            }

            // Fetch user data from database
            try {
                const res = await fetch(`/api/profile?email=${email}`);
                if (res.ok) {
                    const userData = await res.json();

                    // Auto-populate author name and specialization
                    setFormData((prev) => ({
                        ...prev,
                        authorName: userData.name || '',
                        specialization: userData.specialization || userData.doctorProfile?.specialization || '',
                    }));
                } else {
                    // Fallback to localStorage if API fails
                    const name = localStorage.getItem('userName') || '';
                    setFormData((prev) => ({
                        ...prev,
                        authorName: name,
                    }));
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Fallback to localStorage
                const name = localStorage.getItem('userName') || '';
                setFormData((prev) => ({
                    ...prev,
                    authorName: name,
                }));
            }

            setLoading(false);
        };

        fetchUserData();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!formData.authorName.trim()) {
            alert('Please enter author name');
            return;
        }

        if (userRole === 'DOCTOR' && !formData.specialization) {
            alert('Please select a specialization');
            return;
        }

        if (!formData.content.trim()) {
            alert('Please enter blog content');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    authorName: formData.authorName,
                    specialization: userRole === 'DOCTOR' ? formData.specialization : null,
                    content: formData.content,
                    authorRole: userRole,
                }),
            });

            if (res.ok) {
                alert('Blog posted successfully!');
                router.push('/blogs');
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to post blog');
            }
        } catch (error) {
            console.error('Error posting blog:', error);
            alert('An error occurred while posting the blog');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-[#F0F7FF] via-white to-[#E8F4FF]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#739AF0]"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 bg-gradient-to-br from-[#F0F7FF] via-white to-[#E8F4FF]">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0F2D52] mb-4">
                        Create New Blog Post
                    </h1>
                    <p className="text-lg text-gray-600">
                        Share your medical expertise and insights
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
                >
                    {/* Title */}
                    <div className="mb-6">
                        <label
                            htmlFor="title"
                            className="block text-sm font-semibold text-[#0F2D52] mb-2"
                        >
                            Blog Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter an engaging title"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#739AF0] focus:ring-2 focus:ring-[#739AF0]/20 outline-none transition-all duration-300"
                            required
                        />
                    </div>

                    {/* Author Name - Read-only for doctors, editable for admins */}
                    <div className="mb-6">
                        <label
                            htmlFor="authorName"
                            className="block text-sm font-semibold text-[#0F2D52] mb-2"
                        >
                            Author Name *
                        </label>
                        <input
                            type="text"
                            id="authorName"
                            name="authorName"
                            value={formData.authorName}
                            onChange={handleChange}
                            placeholder="Your name"
                            className={`w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#739AF0] focus:ring-2 focus:ring-[#739AF0]/20 outline-none transition-all duration-300 ${userRole === 'DOCTOR' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            required
                            readOnly={userRole === 'DOCTOR'}
                        />
                        {userRole === 'DOCTOR' && (
                            <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                        )}
                    </div>

                    {/* Specialization - Read-only for Doctors, auto-filled from account */}
                    {userRole === 'DOCTOR' && (
                        <div className="mb-6">
                            <label
                                htmlFor="specialization"
                                className="block text-sm font-semibold text-[#0F2D52] mb-2"
                            >
                                Specialization *
                            </label>
                            <input
                                type="text"
                                id="specialization"
                                name="specialization"
                                value={formData.specialization.replace(/_/g, ' ')}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 cursor-not-allowed outline-none"
                                readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                        </div>
                    )}

                    {/* Content */}
                    <div className="mb-6">
                        <label
                            htmlFor="content"
                            className="block text-sm font-semibold text-[#0F2D52] mb-2"
                        >
                            Blog Content *
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Write your blog content here..."
                            rows={12}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#739AF0] focus:ring-2 focus:ring-[#739AF0]/20 outline-none transition-all duration-300 resize-vertical"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <motion.button
                            type="button"
                            onClick={() => router.push('/blogs')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-300"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            type="submit"
                            disabled={submitting}
                            whileHover={{ scale: submitting ? 1 : 1.02 }}
                            whileTap={{ scale: submitting ? 1 : 0.98 }}
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors duration-300 ${submitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#739AF0] hover:bg-[#5a7dd0] text-white shadow-lg'
                                }`}
                        >
                            {submitting ? 'Posting...' : '📝 Post Blog'}
                        </motion.button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
