import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

// POST: Generate content from Gemini AI
export async function POST(request) {
    try {
        const body = await request.json();
        const { prompt, modelName } = body;

        // Validate prompt
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { message: 'Prompt is required and must be a string.' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { message: 'Gemini API key is not configured.' },
                { status: 500 }
            );
        }

        // Generate content using Gemini
        const result = await generateContent(prompt, modelName);

        if (!result.success) {
            return NextResponse.json(
                { message: 'Failed to generate content', error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            response: result.text,
        });

    } catch (error) {
        console.error('Gemini API Route Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
