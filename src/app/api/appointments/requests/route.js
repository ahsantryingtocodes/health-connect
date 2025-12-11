import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch pending appointment requests for a doctor
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctorProfileId = searchParams.get('doctorProfileId');

  if (!doctorProfileId) {
    return NextResponse.json({ message: 'DoctorProfileId required' }, { status: 400 });
  }

  try {
    const requests = await prisma.appointment.findMany({
      where: {
        doctorProfileId: Number(doctorProfileId),
        status: 'PENDING',
      },
      include: {
        patient: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching requests', error: error.message }, { status: 500 });
  }
}
