import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT: Send prescription
export async function PUT(request) {
  try {
    const body = await request.json();
    const { prescriptionId } = body;

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'SENT' },
    });

    return NextResponse.json({ message: 'Prescription sent', updated });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to send prescription' }, { status: 500 });
  }
}