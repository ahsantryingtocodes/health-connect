import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const VALID_SPECIALIZATIONS = [
  'CARDIOLOGY',
  'DERMATOLOGY',
  'PEDIATRICS',
  'NEUROLOGY',
  'ORTHOPEDICS',
  'PSYCHIATRY',
  'GENERAL_PRACTICE',
  'ONCOLOGY'
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, contactNumber, specialization } = body;

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email.' },
        { status: 400 }
      );
    }

    // 2. Validate specialization for doctors
    if (role === 'DOCTOR' && !specialization) {
      return NextResponse.json(
        { message: 'Specialization is required for doctors.' },
        { status: 400 }
      );
    }

    // 3. Validate specialization is a valid enum value
    if (role === 'DOCTOR' && !VALID_SPECIALIZATIONS.includes(specialization)) {
      return NextResponse.json(
        { message: 'Invalid specialization selected.' },
        { status: 400 }
      );
    }

    // 4. Determine Verification Status
    // Doctors must be verified by an admin (false), Patients are auto-verified (true)
    const isVerified = role === 'DOCTOR' ? false : true;

    // 5. Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        contactNumber,
        specialization: role === 'DOCTOR' ? specialization : null,
        isVerified, // Save the status
      },
    });

    return NextResponse.json(
      { message: 'User registered successfully!' },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}