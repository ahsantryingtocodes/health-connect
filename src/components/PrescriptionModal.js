'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrescriptionModal({ isOpen, onClose, appointment, onSuccess }) {
    const [formData, setFormData] = useState({
        symptoms: '',
        advice: '',
        followUpDate: '',
        medicines: [{ name: '', dosage: '', duration: '', notes: '' }],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddMedicine = () => {
        setFormData({
            ...formData,
            medicines: [...formData.medicines, { name: '', dosage: '', duration: '', notes: '' }],
        });
    };

    const handleRemoveMedicine = (index) => {
        const newMedicines = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: newMedicines });
    };

    const handleMedicineChange = (index, field, value) => {
        const newMedicines = [...formData.medicines];
        newMedicines[index][field] = value;
        setFormData({ ...formData, medicines: newMedicines });
    };

    const handleSubmit = async () => {
        if (!formData.symptoms.trim()) {
            setError('Symptoms are required');
            return;
        }

        // Filter out empty medicines
        const validMedicines = formData.medicines.filter(
            (med) => med.name.trim() && med.dosage.trim() && med.duration.trim()
        );

        setLoading(true);
        setError('');

        try {
            // Extract IDs from appointment
            const patientId = appointment.patientId || appointment.patient?.id;
            const doctorUserId = appointment.doctorUserId;

            if (!patientId || !doctorUserId) {
                throw new Error('Missing required patient or doctor information');
            }

            // Create prescription
            const prescriptionRes = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    doctorId: doctorUserId,
                    patientId: patientId,
                    symptoms: formData.symptoms,
                    advice: formData.advice || null,
                    followUpDate: formData.followUpDate || null,
                    medicines: validMedicines,
                }),
            });

            const prescriptionData = await prescriptionRes.json();

            if (!prescriptionRes.ok) {
                throw new Error(prescriptionData.message || 'Failed to create prescription');
            }

            // Send to patient immediately
            const sendRes = await fetch('/api/prescriptions/send', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prescriptionId: prescriptionData.prescription.id }),
            });

            if (!sendRes.ok) {
                throw new Error('Failed to send prescription');
            }

            onSuccess('Prescription sent to patient successfully!');
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[24px] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto card-shadow"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-[#0F2D52]">Create Prescription</h2>
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
                        {/* Patient Info */}
                        <div className="p-4 bg-[#F0F7FF] rounded-[20px]">
                            <p className="text-sm font-semibold text-[#0F2D52]">
                                Patient: {appointment.patient?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-[#4a5568] mt-1">
                                Date: {new Date(appointment.date).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Symptoms */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F2D52] mb-2">
                                Symptoms <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.symptoms}
                                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:border-[#739AF0] focus:outline-none"
                                rows="4"
                                placeholder="Describe the patient's symptoms..."
                            />
                        </div>

                        {/* Medicines */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-bold text-[#0F2D52]">Medicines</label>
                                <button
                                    onClick={handleAddMedicine}
                                    className="px-4 py-2 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold text-sm"
                                >
                                    + Add Medicine
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.medicines.map((medicine, index) => (
                                    <div key={index} className="p-4 border-2 border-[#F0F7FF] rounded-[20px] space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-[#0F2D52]">Medicine {index + 1}</span>
                                            {formData.medicines.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveMedicine(index)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Medicine name"
                                                value={medicine.name}
                                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                className="p-2 border-2 border-[#F0F7FF] rounded-[15px] focus:border-[#739AF0] focus:outline-none text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dosage (e.g., 500mg)"
                                                value={medicine.dosage}
                                                onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                className="p-2 border-2 border-[#F0F7FF] rounded-[15px] focus:border-[#739AF0] focus:outline-none text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Duration (e.g., 7 days)"
                                                value={medicine.duration}
                                                onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                className="p-2 border-2 border-[#F0F7FF] rounded-[15px] focus:border-[#739AF0] focus:outline-none text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Notes (optional)"
                                                value={medicine.notes}
                                                onChange={(e) => handleMedicineChange(index, 'notes', e.target.value)}
                                                className="p-2 border-2 border-[#F0F7FF] rounded-[15px] focus:border-[#739AF0] focus:outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Advice */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F2D52] mb-2">Medical Advice</label>
                            <textarea
                                value={formData.advice}
                                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:border-[#739AF0] focus:outline-none"
                                rows="3"
                                placeholder="Any additional advice for the patient..."
                            />
                        </div>

                        {/* Follow-up Date */}
                        <div>
                            <label className="block text-sm font-bold text-[#0F2D52] mb-2">Follow-up Date (Optional)</label>
                            <input
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                className="w-full p-3 border-2 border-[#F0F7FF] rounded-[20px] focus:border-[#739AF0] focus:outline-none"
                            />
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-[#739AF0] text-white rounded-[20px] hover:bg-[#5a7bc0] font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send to Patient'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}