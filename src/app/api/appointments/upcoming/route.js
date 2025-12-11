import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Confirmed appointments for doctor
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctorProfileId = searchParams.get('doctorProfileId');

  if (!doctorProfileId) return NextResponse.json({ message: 'DoctorProfileId required' }, { status: 400 });

  try {
    const upcoming = await prisma.appointment.findMany({
      where: {
        doctorProfileId: Number(doctorProfileId),
        status: 'CONFIRMED',
      },
      include: { patient: true },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(upcoming);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching upcoming appointments', error: error.message }, { status: 500 });
  }
}
