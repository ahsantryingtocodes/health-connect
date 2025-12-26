import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Check if review exists for an appointment
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const appointmentId = searchParams.get('appointmentId');

        if (!appointmentId) {
            return NextResponse.json({ message: 'appointmentId is required' }, { status: 400 });
        }

        const review = await prisma.review.findUnique({
            where: { appointmentId: Number(appointmentId) },
            include: {
                patient: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            hasReview: !!review,
            review: review || null,
        });
    } catch (error) {
        console.error('Error checking review:', error);
        return NextResponse.json({ message: 'Failed to check review', error: error.message }, { status: 500 });
    }
}
