import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Reschedule confirmed appointment
export async function PUT(request) {
  try {
    const body = await request.json();
    const { appointmentId, newDate } = body;

    if (!appointmentId || !newDate) return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { date: new Date(newDate) },
      include: { patient: true },
    });

    return NextResponse.json({ message: 'Appointment rescheduled', appointment: updated });
  } catch (error) {
    return NextResponse.json({ message: 'Reschedule failed', error: error.message }, { status: 500 });
  }
}
