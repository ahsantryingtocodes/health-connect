import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all doctors with their profiles
export async function GET(request) {
    try {
        const doctors = await prisma.doctorProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        specialization: true,
                    },
                },
            },
            orderBy: {
                user: {
                    name: 'asc',
                },
            },
        });

        return NextResponse.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json({ message: 'Failed to fetch doctors', error: error.message }, { status: 500 });
    }
}
