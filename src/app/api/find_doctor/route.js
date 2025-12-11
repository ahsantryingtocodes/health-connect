import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. GET: Fetch doctors with filters (specialization, availableToday)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get('specialization');
  const availableToday = searchParams.get('availableToday');

  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        ...(specialization && { specialization }),
        ...(availableToday && { availableToday: availableToday === 'true' }),
      },
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
    });

    return NextResponse.json(doctors);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch doctors' }, { status: 500 });
  }
}