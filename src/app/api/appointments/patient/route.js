import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch appointments for a patient
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const status = searchParams.get('status'); // Optional: filter by status

  if (!patientId) {
    return NextResponse.json({ message: 'patientId required' }, { status: 400 });
  }

  try {
    const where = {
      patientId: Number(patientId),
      ...(status && { status }),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
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
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching patient appointments', error: error.message },
      { status: 500 }
    );
  }
}

