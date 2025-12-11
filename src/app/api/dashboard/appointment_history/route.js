import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch appointment history for a doctor
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');

  if (!doctorId) {
    return NextResponse.json({ message: 'doctorId required' }, { status: 400 });
  }

  try {
    // Fetch prescriptions with patient details and appointment
    const history = await prisma.prescription.findMany({
      where: {
        doctorId: Number(doctorId),
        status: 'SENT', // only prescriptions that are sent
      },
      include: {
        patient: true,
        appointment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map the response for front-end
    const formattedHistory = history.map(p => ({
      patientName: p.patient.name,
      symptoms: p.symptoms,
      prescriptionDate: p.createdAt,
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching appointment history', error: error.message }, { status: 500 });
  }
}
