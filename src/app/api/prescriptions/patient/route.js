import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json(
      { message: 'patientId is required' },
      { status: 400 }
    );
  }

  try {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: Number(patientId),
        status: 'SENT',
      },
      include: {
        medicines: true,
      },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}