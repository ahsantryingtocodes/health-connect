import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Create a review
export async function POST(request) {
    try {
        const body = await request.json();
        const { appointmentId, patientId, doctorId, rating, comment } = body;

        // Validation
        if (!appointmentId || !patientId || !doctorId || !rating) {
            return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        // Check if appointment exists and is completed
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.patientId !== patientId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
            where: { appointmentId },
        });

        if (existingReview) {
            return NextResponse.json({ message: 'Review already exists for this appointment' }, { status: 400 });
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                appointmentId,
                patientId,
                doctorId,
                rating,
                comment: comment || null,
            },
        });

        return NextResponse.json({ message: 'Review created successfully', review });
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ message: 'Failed to create review', error: error.message }, { status: 500 });
    }
}

// GET: Fetch reviews for a doctor
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const isDoctor = searchParams.get('isDoctor') === 'true';

        if (!doctorId) {
            return NextResponse.json({ message: 'doctorId is required' }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { doctorId: Number(doctorId) },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // If doctor is viewing, anonymize patient names
        const processedReviews = reviews.map((review) => ({
            ...review,
            patient: {
                id: review.patient.id,
                name: isDoctor ? 'Anonymous Patient' : review.patient.name,
            },
        }));

        return NextResponse.json(processedReviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ message: 'Failed to fetch reviews', error: error.message }, { status: 500 });
    }
}
