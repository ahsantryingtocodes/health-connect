'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    const userEmail = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    setIsLoggedIn(!!userEmail);
    setUserRole(role);

    // Fetch notifications if logged in
    if (userEmail) {
      fetchNotifications(userEmail);

      // Poll for notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications(userEmail);
      }, 30000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, []);

  const fetchNotifications = async (email) => {
    try {
      const res = await fetch(`/api/notifications?email=${email}`);
      if (res.ok) {
        const notifications = await res.json();
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold text-[#0F2D52] tracking-wide">
            HealthConnect
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Dashboard - Only when logged in */}
            {isLoggedIn && (
              <Link
                href={userRole === 'DOCTOR' ? '/doctor-dashboard' : '/patient-dashboard'}
                className="hidden md:block text-[#0F2D52] font-semibold hover:text-[#739AF0] transition-colors duration-300"
              >
                Dashboard
              </Link>
            )}

            {/* Book Appointment - Hidden for Doctors */}
            {isLoggedIn && userRole !== 'DOCTOR' && (
              <Link
                href="/book-appointment"
                className="hidden md:block text-[#0F2D52] font-semibold hover:text-[#739AF0] transition-colors duration-300"
              >
                Book Appointment
              </Link>
            )}

            {/* Notification Bell - Only when logged in */}
            {isLoggedIn && (
              <Link
                href={userRole === 'DOCTOR' ? '/doctor-dashboard#notifications' : '/patient-dashboard#notifications'}
                className="relative block"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 text-[#0F2D52] hover:text-[#739AF0] transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center pointer-events-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            )}

            {/* Profile Link - Only when logged in */}
            {isLoggedIn && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link href="/profile" className="block">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 text-[#0F2D52] hover:text-[#739AF0] transition-colors duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </Link>
              </motion.div>
            )}

            {/* Logout Button - Only when logged in */}
            {isLoggedIn && (
              <motion.button
                onClick={() => {
                  localStorage.removeItem('userEmail');
                  localStorage.removeItem('userRole');
                  window.location.href = '/login';
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="px-4 md:px-6 py-2 bg-red-500 text-white rounded-[20px] text-sm md:text-base font-semibold hover:bg-red-600 transition-colors duration-300 shadow-md"
              >
                Logout
              </motion.button>
            )}

            {/* Login & Register - Only when NOT logged in */}
            {!isLoggedIn && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href="/login"
                    className="px-4 md:px-6 py-2 bg-[#739AF0] text-white rounded-[20px] text-sm md:text-base font-semibold hover:bg-[#5a7dd0] transition-colors duration-300 shadow-md"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href="/register"
                    className="px-4 md:px-6 py-2 bg-white text-[#739AF0] border-2 border-[#739AF0] rounded-[20px] text-sm md:text-base font-semibold hover:bg-[#F0F7FF] transition-colors duration-300 shadow-md"
                  >
                    Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

