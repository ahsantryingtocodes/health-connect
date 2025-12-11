import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Add medicine to existing prescription
export async function POST(request) {
  try {
    const body = await request.json();
    const { prescriptionId, name, dosage, duration, notes } = body;

    const medicine = await prisma.medicine.create({
      data: {
        prescriptionId,
        name,
        dosage,
        duration,
        notes,
      },
    });

    return NextResponse.json({ message: 'Medicine added', medicine });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to add medicine' }, { status: 500 });
  }
}