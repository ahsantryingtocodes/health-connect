import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { appointmentId, action } = body;

    if (!appointmentId || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const status = action === 'ACCEPT' ? 'CONFIRMED' : 'REJECTED';

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: { patient: true },
    });

    return NextResponse.json({
      message: `Appointment ${status.toLowerCase()}`,
      appointment: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Decision failed', error: error.message },
      { status: 500 }
    );
  }
}
