'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const services = [
  {
    title: 'General Consultation',
    description: 'Comprehensive health check-ups and consultations with experienced physicians.',
    icon: '🏥',
  },
  {
    title: 'Specialist Care',
    description: 'Access to specialized doctors across various medical disciplines.',
    icon: '👨‍⚕️',
  },
  {
    title: 'Emergency Services',
    description: '24/7 emergency care with immediate response and expert medical attention.',
    icon: '🚑',
  },
  {
    title: 'Preventive Care',
    description: 'Regular screenings and preventive measures to maintain optimal health.',
    icon: '💊',
  },
  {
    title: 'Mental Health',
    description: 'Professional counseling and mental health support services.',
    icon: '🧠',
  },
  {
    title: 'Telemedicine',
    description: 'Remote consultations via video or chat for your convenience.',
    icon: '💻',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F7FF]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-[#0F2D52] mb-6 tracking-wide">
              HealthConnect
            </h1>
            <p className="text-xl md:text-2xl text-[#4a5568] mb-10 leading-relaxed font-light">
              Your trusted partner in healthcare. Connecting you with expert medical professionals
              for comprehensive, compassionate care.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link
                href="/login"
                className="inline-block px-10 py-4 bg-[#739AF0] text-white rounded-[24px] text-lg font-semibold shadow-lg hover:bg-[#5a7dd0] transition-colors duration-300"
              >
                Login
              </Link>

              <p className="text-lg text-[#4a5568] mb-10 max-w-2xl mx-auto">
              </p>
              <Link
                href="/register"
                className="inline-block px-10 py-4 bg-[#739AF0] text-white rounded-[24px] text-lg font-semibold shadow-lg hover:bg-[#5a7dd0] transition-colors duration-300"
              >
                Register
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F2D52] mb-4 tracking-wide">
              Our Services
            </h2>
            <p className="text-lg text-[#4a5568] max-w-2xl mx-auto">
              Comprehensive healthcare solutions tailored to meet your needs
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-[#F0F7FF] rounded-[24px] p-8 card-shadow hover:card-shadow-hover transition-all duration-300"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-[#0F2D52] mb-3 tracking-wide">
                  {service.title}
                </h3>
                <p className="text-[#4a5568] leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#F0F7FF]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F2D52] mb-6 tracking-wide">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-[#4a5568] mb-10 max-w-2xl mx-auto">
              Book your appointment today and take the first step towards better health
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  href="/book-appointment"
                  className="inline-block px-10 py-4 bg-[#739AF0] text-white rounded-[24px] text-lg font-semibold shadow-lg hover:bg-[#5a7dd0] transition-colors duration-300"
                >
                  Get An Appointment
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  href="/register"
                  className="inline-block px-10 py-4 bg-white text-[#739AF0] border-2 border-[#739AF0] rounded-[24px] text-lg font-semibold shadow-lg hover:bg-[#F0F7FF] transition-colors duration-300"
                >
                  Create Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
