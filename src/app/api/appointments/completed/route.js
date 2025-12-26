import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch completed appointments (past appointments with CONFIRMED status)
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
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // Current time - 1 hour

        const where = {
            OR: [
                // Manually marked as completed
                { status: 'COMPLETED' },
                // Or confirmed appointments more than 1 hour past
                {
                    status: 'CONFIRMED',
                    date: { lt: oneHourAgo }
                }
            ],
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
            orderBy: { date: 'desc' }, // Most recent first
        });

        return NextResponse.json(appointments);
    } catch (error) {
        return NextResponse.json(
            { message: 'Error fetching completed appointments', error: error.message },
            { status: 500 }
        );
    }
}
