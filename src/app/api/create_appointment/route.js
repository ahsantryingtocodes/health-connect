import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. POST: Create new appointment
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, doctorProfileId, consultationType, date } = body;

    if (!patientId || !doctorProfileId || !consultationType || !date) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorProfileId,
        consultationType,
        date: new Date(date),
      },
    });

    // Notify doctor about new appointment request
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: { user: true },
    });
    if (doctorProfile?.user?.email) {
      await prisma.notification.create({
        data: {
          userEmail: doctorProfile.user.email,
          message: 'New appointment request received.',
        },
      });
    }

    return NextResponse.json({ message: 'Appointment created', appointment });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create appointment' }, { status: 500 });
  }
}