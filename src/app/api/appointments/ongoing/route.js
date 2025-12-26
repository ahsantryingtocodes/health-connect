import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch ongoing appointments (appointments currently in progress - within 1 hour window)
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorProfileId = searchParams.get('doctorProfileId');

    if (!patientId && !doctorProfileId) {
        return NextResponse.json(
            { message: 'Either patientId or doctorProfileId is required' },
            { status: 400 }
        );
    }

    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Current time + 1 hour

        const where = {
            status: 'CONFIRMED',
            // Appointment time must be <= current time (appointment has started)
            // AND appointment time + 1 hour must be > current time (appointment hasn't ended)
            date: {
                lte: now, // Appointment has started
                gte: new Date(now.getTime() - 60 * 60 * 1000), // Within the last hour
            },
            ...(patientId && { patientId: Number(patientId) }),
            ...(doctorProfileId && { doctorProfileId: Number(doctorProfileId) }),
        };

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                ...(patientId && {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    contactNumber: true,
                                },
                            },
                        },
                    },
                }),
                ...(doctorProfileId && {
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            contactNumber: true,
                        },
                    },
                }),
            },
            orderBy: { date: 'asc' }, // Earliest first
        });

        return NextResponse.json(appointments);
    } catch (error) {
        return NextResponse.json(
            { message: 'Error fetching ongoing appointments', error: error.message },
            { status: 500 }
        );
    }
}
