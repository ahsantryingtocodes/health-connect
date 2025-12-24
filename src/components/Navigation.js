'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navigation() {
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
            <Link
              href="/book-appointment"
              className="hidden md:block text-[#0F2D52] font-semibold hover:text-[#739AF0] transition-colors duration-300"
            >
              Book Appointment
            </Link>
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
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

