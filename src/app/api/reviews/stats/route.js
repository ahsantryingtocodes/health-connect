import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get rating statistics for a doctor
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');

        if (!doctorId) {
            return NextResponse.json({ message: 'doctorId is required' }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { doctorId: Number(doctorId) },
            select: { rating: true },
        });

        if (reviews.length === 0) {
            return NextResponse.json({
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            });
        }

        // Calculate average
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);

        // Calculate distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((review) => {
            ratingDistribution[review.rating]++;
        });

        return NextResponse.json({
            averageRating: parseFloat(averageRating),
            totalReviews: reviews.length,
            ratingDistribution,
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        return NextResponse.json({ message: 'Failed to fetch stats', error: error.message }, { status: 500 });
    }
}
