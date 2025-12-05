import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, contactNumber } = body;

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

    // 2. Determine Verification Status
    // Doctors must be verified by an admin (false), Patients are auto-verified (true)
    const isVerified = role === 'DOCTOR' ? false : true;

    // 3. Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, 
        role,
        contactNumber,
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