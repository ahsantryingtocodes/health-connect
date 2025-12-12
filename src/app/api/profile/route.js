import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. GET: Fetch user details
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                contactNumber: true,
              },
            },
          },
        },
      },
    });
    
    if (user) {
      const { password, ...userWithoutPass } = user; // Remove password for security
      return NextResponse.json(userWithoutPass);
    }
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching profile' }, { status: 500 });
  }
}

// 2. PUT: Update user details
export async function PUT(request) {
  try {
    const body = await request.json();
    const { email, name, contactNumber } = body;

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name, contactNumber },
    });

    return NextResponse.json({ message: 'Success', user: updatedUser });
  } catch (error) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}

// 3. DELETE: Delete user account
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    await prisma.user.delete({
      where: { email },
    });
    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}