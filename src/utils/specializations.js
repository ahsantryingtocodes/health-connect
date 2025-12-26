// Specialization enum values matching Prisma schema
export const SPECIALIZATIONS = [
    'CARDIOLOGY',
    'DERMATOLOGY',
    'PEDIATRICS',
    'NEUROLOGY',
    'ORTHOPEDICS',
    'PSYCHIATRY',
    'GENERAL_PRACTICE',
    'ONCOLOGY'
];

// Format specialization enum for display
export function formatSpecialization(spec) {
    if (!spec) return 'General Physician';

    // Convert GENERAL_PRACTICE to "General Practice", etc.
    return spec
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

// Get all specialization options for dropdowns
export function getSpecializationOptions() {
    return SPECIALIZATIONS.map(spec => ({
        value: spec,
        label: formatSpecialization(spec)
    }));
}
