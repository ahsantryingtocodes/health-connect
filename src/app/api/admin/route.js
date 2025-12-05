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

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        isVerified: isVerified,
        role: role 
      },
    });

    return NextResponse.json({ message: 'User updated', user: updatedUser });
  } catch (error) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
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