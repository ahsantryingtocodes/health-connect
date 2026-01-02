// src/app/api/video/route.js
import { NextResponse } from 'next/server';
import generateVideoToken from '@/lib/stream-video';

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, userName, appointmentId } = body;

        if (!userId || !userName || !appointmentId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate the token using the official SDK wrapper
        const token = generateVideoToken(userId);

        return NextResponse.json({
            token,
            userId: String(userId),
            userName,
            // Pass the API Key to the client so it matches the server environment
            apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY,
            callId: appointmentId
        });

    } catch (error) {
        console.error('Token Generation Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}