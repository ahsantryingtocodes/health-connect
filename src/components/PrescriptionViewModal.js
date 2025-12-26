'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatSpecialization } from '@/utils/specializations';

export default function PrescriptionViewModal({ isOpen, onClose, prescription }) {
    if (!isOpen || !prescription) return null;

    const appointmentDate = prescription.appointment?.date
        ? new Date(prescription.appointment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'N/A';

    const followUpDate = prescription.followUpDate
        ? new Date(prescription.followUpDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

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
                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[#F0F7FF]">
                        <div>
                            <h2 className="text-3xl font-bold text-[#0F2D52]">Medical Prescription</h2>
                            <p className="text-sm text-[#4a5568] mt-1">Prescription Details</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#4a5568] hover:text-[#0F2D52] text-3xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Doctor Information */}
                        <div className="bg-[#F0F7FF] rounded-[20px] p-5">
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Doctor Information</h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Name:</span>{' '}
                                    <span className="text-[#4a5568]">Dr. {prescription.doctor?.name || 'N/A'}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Specialization:</span>{' '}
                                    <span className="text-[#4a5568]">{prescription.doctor?.specialization ? formatSpecialization(prescription.doctor.specialization) : 'General Physician'}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Email:</span>{' '}
                                    <span className="text-[#4a5568]">{prescription.doctor?.email || 'N/A'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Patient Information */}
                        <div className="bg-[#F0F7FF] rounded-[20px] p-5">
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Patient Information</h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Name:</span>{' '}
                                    <span className="text-[#4a5568]">{prescription.patient?.name || 'N/A'}</span>
                                </p>
                                {prescription.patient?.contactNumber && (
                                    <p className="text-sm">
                                        <span className="font-semibold text-[#0F2D52]">Contact:</span>{' '}
                                        <span className="text-[#4a5568]">{prescription.patient.contactNumber}</span>
                                    </p>
                                )}
                                <p className="text-sm">
                                    <span className="font-semibold text-[#0F2D52]">Email:</span>{' '}
                                    <span className="text-[#4a5568]">{prescription.patient?.email || 'N/A'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div className="bg-[#F0F7FF] rounded-[20px] p-5">
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Appointment Details</h3>
                            <p className="text-sm">
                                <span className="font-semibold text-[#0F2D52]">Date:</span>{' '}
                                <span className="text-[#4a5568]">{appointmentDate}</span>
                            </p>
                            {prescription.appointment?.consultationType && (
                                <p className="text-sm mt-2">
                                    <span className="font-semibold text-[#0F2D52]">Type:</span>{' '}
                                    <span className="text-[#4a5568] capitalize">{prescription.appointment.consultationType}</span>
                                </p>
                            )}
                        </div>

                        {/* Symptoms */}
                        <div>
                            <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Symptoms</h3>
                            <div className="bg-white border-2 border-[#F0F7FF] rounded-[20px] p-5">
                                <p className="text-sm text-[#4a5568] whitespace-pre-wrap">{prescription.symptoms}</p>
                            </div>
                        </div>

                        {/* Medicines */}
                        {prescription.medicines && prescription.medicines.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Prescribed Medicines</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-2 border-[#F0F7FF] rounded-[20px] overflow-hidden">
                                        <thead className="bg-[#739AF0] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Medicine Name</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Dosage</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Duration</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {prescription.medicines.map((medicine, index) => (
                                                <tr
                                                    key={index}
                                                    className={index % 2 === 0 ? 'bg-white' : 'bg-[#F0F7FF]'}
                                                >
                                                    <td className="px-4 py-3 text-sm text-[#0F2D52] font-medium">{medicine.name}</td>
                                                    <td className="px-4 py-3 text-sm text-[#4a5568]">{medicine.dosage}</td>
                                                    <td className="px-4 py-3 text-sm text-[#4a5568]">{medicine.duration}</td>
                                                    <td className="px-4 py-3 text-sm text-[#4a5568]">{medicine.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Medical Advice */}
                        {prescription.advice && (
                            <div>
                                <h3 className="text-lg font-bold text-[#0F2D52] mb-3">Medical Advice</h3>
                                <div className="bg-white border-2 border-[#F0F7FF] rounded-[20px] p-5">
                                    <p className="text-sm text-[#4a5568] whitespace-pre-wrap">{prescription.advice}</p>
                                </div>
                            </div>
                        )}

                        {/* Follow-up Date */}
                        {followUpDate && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-[20px] p-5">
                                <h3 className="text-lg font-bold text-orange-700 mb-2">Follow-up Appointment</h3>
                                <p className="text-sm text-orange-600">
                                    <span className="font-semibold">Scheduled for:</span> {followUpDate}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t-2 border-[#F0F7FF]">
                            <p className="text-xs text-[#4a5568] text-center">
                                This is a digitally generated prescription from Health Connect.
                            </p>
                            <p className="text-xs text-[#4a5568] text-center mt-1">
                                Please consult your doctor before taking any medication.
                            </p>
                        </div>

                        {/* Close Button */}
                        <div className="pt-2">
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold"
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