import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Create prescription draft
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      appointmentId,
      doctorId,
      patientId,
      symptoms,
      advice,
      followUpDate,
      medicines
    } = body;

    if (!appointmentId || !doctorId || !patientId || !symptoms) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        doctorId,
        patientId,
        symptoms,
        advice,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        medicines: {
          create: medicines || [],
        },
      },
      include: {
        medicines: true,
      },
    });

    return NextResponse.json({ message: 'Prescription draft created', prescription });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ message: 'Failed to create prescription', error: error.message }, { status: 500 });
  }
}