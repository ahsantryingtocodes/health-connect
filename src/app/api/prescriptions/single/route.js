import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get single prescription
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ message: 'Prescription ID required' }, { status: 400 });

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: Number(id) },
      include: { medicines: true },
    });

    return NextResponse.json(prescription);
  } catch (error) {
    return NextResponse.json({ message: 'Fetch failed' }, { status: 500 });
  }
}