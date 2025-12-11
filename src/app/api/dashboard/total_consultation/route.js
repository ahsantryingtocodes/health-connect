import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch total consultations for the current month
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');

  if (!doctorId) {
    return NextResponse.json({ message: 'doctorId required' }, { status: 400 });
  }

  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.prescription.count({
      where: {
        doctorId: Number(doctorId),
        status: 'SENT',
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    return NextResponse.json({ totalConsultations: count });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching total consultations', error: error.message }, { status: 500 });
  }
}
