import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch single doctor profile by doctorProfile id
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'DoctorProfile id required' }, { status: 400 });
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true,
            role: true,
            verified: true
          }
        }
      }
    });

    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('GET /api/doctors/detail error:', error);
    return NextResponse.json({ message: 'Failed to fetch doctor' }, { status: 500 });
  }
}
