import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Mark appointment as completed
export async function PUT(request) {
    try {
        const body = await request.json();
        const { appointmentId } = body;

        if (!appointmentId) {
            return NextResponse.json({ message: 'appointmentId is required' }, { status: 400 });
        }

        // Update appointment status to COMPLETED
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'COMPLETED' },
        });

        return NextResponse.json({ message: 'Appointment marked as completed', appointment: updated });
    } catch (error) {
        console.error('Error completing appointment:', error);
        return NextResponse.json(
            { message: 'Failed to complete appointment', error: error.message },
            { status: 500 }
        );
    }
}
