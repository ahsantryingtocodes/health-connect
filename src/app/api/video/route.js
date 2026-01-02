import { NextResponse } from 'next/server';
import generateVideoToken from '@/lib/stream-video';

/**
 * POST /api/video
 * Generate a video token for a user
 * 
 * Request body:
 * - userId: string (required) - Unique identifier for the user
 * - userName: string (required) - Display name for the user
 * - appointmentId: string (required) - Used as the callId
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, userName, appointmentId } = body;

        // Validate required fields
        if (!userId || !userName || !appointmentId) {
            return NextResponse.json(
                {
                    message: 'Missing required fields',
                    required: ['userId', 'userName', 'appointmentId']
                },
                { status: 400 }
            );
        }

        // Generate JWT token with 24-hour expiration
        const expirationInSeconds = 24 * 60 * 60;
        const token = generateVideoToken(userId, expirationInSeconds);

        // Return token and user details
        return NextResponse.json(
            {
                token,
                userId,
                userName,
                callId: appointmentId,
                apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Token Generation Error:', error);
        return NextResponse.json(
            {
                message: 'Failed to generate video token',
                error: error.message
            },
            { status: 500 }
        );
    }
}