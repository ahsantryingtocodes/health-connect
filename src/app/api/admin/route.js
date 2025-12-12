import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch ALL users for the dashboard
export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Remove passwords for security
    const safeUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

// PATCH: Approve a doctor or Change Role
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { email, isVerified, role } = body;

    // First, get the user to check their role and specialization
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        isVerified: isVerified,
        ...(role && { role: role })
      },
    });

    // If verifying a doctor and they have specialization, create DoctorProfile
    if (isVerified && updatedUser.role === 'DOCTOR' && updatedUser.specialization) {
      // Check if DoctorProfile already exists
      const existingProfile = await prisma.doctorProfile.findUnique({
        where: { userId: updatedUser.id },
      });

      if (!existingProfile) {
        // Create DoctorProfile
        await prisma.doctorProfile.create({
          data: {
            userId: updatedUser.id,
            specialization: updatedUser.specialization,
            availableToday: false,
          },
        });
      }
    }

    return NextResponse.json({ message: 'User updated', user: updatedUser });
  } catch (error) {
    console.error('Admin update error:', error);
    return NextResponse.json({ message: 'Update failed', error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a user
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    await prisma.user.delete({ where: { email } });
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}