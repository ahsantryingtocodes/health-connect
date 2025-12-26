import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get prescription by appointment ID
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
        return NextResponse.json({ message: 'appointmentId is required' }, { status: 400 });
    }

    try {
        const prescription = await prisma.prescription.findUnique({
            where: { appointmentId: Number(appointmentId) },
            include: {
                medicines: true,
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        specialization: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactNumber: true,
                    },
                },
                appointment: {
                    select: {
                        date: true,
                        consultationType: true,
                    },
                },
            },
        });

        if (!prescription) {
            return NextResponse.json({ message: 'Prescription not found' }, { status: 404 });
        }

        return NextResponse.json(prescription);
    } catch (error) {
        console.error('Error fetching prescription:', error);
        return NextResponse.json(
            { message: 'Failed to fetch prescription', error: error.message },
            { status: 500 }
        );
    }
}