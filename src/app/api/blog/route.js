import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(blogs);
}

export async function POST(request) {
  const body = await request.json();
  const { authorName, specialization, title, content, authorRole } = body;

  if (authorRole === 'PATIENT') {
    return NextResponse.json(
      { message: 'Not authorized' },
      { status: 403 }
    );
  }

  const blog = await prisma.blog.create({
    data: {
      authorName,
      specialization,
      title,
      content,
      authorRole,
    },
  });

  return NextResponse.json(blog, { status: 201 });
}
