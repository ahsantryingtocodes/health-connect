import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. GET: Fetch notifications for a user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userEmail: email },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
  }
}

// 2. POST: Create a new notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, message } = body;

    if (!email || !message) {
      return NextResponse.json({ message: 'Email and message are required' }, { status: 400 });
    }

    const newNotification = await prisma.notification.create({
      data: {
        userEmail: email,
        message,
      },
    });

    return NextResponse.json({ message: 'Notification sent!', notification: newNotification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating notification' }, { status: 500 });
  }
}

// 3. PUT: Mark notifications as read (by id or by user email)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, email, read = true } = body;

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { read },
      });
      return NextResponse.json({ message: 'Notification updated', notification: updated });
    }

    if (email) {
      const updatedMany = await prisma.notification.updateMany({
        where: { userEmail: email },
        data: { read },
      });
      return NextResponse.json({ message: 'Notifications updated', count: updatedMany.count });
    }

    return NextResponse.json({ message: 'id or email required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating notification' }, { status: 500 });
  }
}

