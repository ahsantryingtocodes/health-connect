import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Update doctor availability
export async function PUT(request) {
  try {
    const body = await request.json();
    const { doctorProfileId, availableToday } = body;

    if (doctorProfileId === undefined || availableToday === undefined) {
      return NextResponse.json({ message: 'doctorProfileId and availableToday are required' }, { status: 400 });
    }

    const updated = await prisma.doctorProfile.update({
      where: { id: Number(doctorProfileId) },
      data: { availableToday: Boolean(availableToday) },
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

    return NextResponse.json({
      message: 'Availability updated successfully',
      doctorProfile: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Failed to update availability', error: error.message },
      { status: 500 }
    );
  }
}

