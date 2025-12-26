import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import prisma from '@/lib/prisma';

// Valid specializations from Prisma enum
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

// POST: Analyze symptoms and get recommendations
export async function POST(request) {
    try {
        const body = await request.json();
        const { symptoms } = body;

        // Validate symptoms
        if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 10) {
            return NextResponse.json(
                { message: 'Please provide detailed symptoms (at least 10 characters).' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { message: 'AI service is not configured.' },
                { status: 500 }
            );
        }

        // Create structured prompt for Gemini
        const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a response in STRICT JSON format.

Symptoms: "${symptoms}"

You must respond with ONLY a valid JSON object (no markdown, no code blocks, no additional text) with this exact structure:
{
  "condition": "Brief name of the possible condition",
  "treatment": "Detailed treatment recommendations and advice (3-5 sentences)",
  "specialization": "ONE of these exact values: CARDIOLOGY, DERMATOLOGY, PEDIATRICS, NEUROLOGY, ORTHOPEDICS, PSYCHIATRY, GENERAL_PRACTICE, ONCOLOGY",
  "urgency": "ONE of: low, moderate, high"
}

Important:
- For specialization, choose the MOST appropriate from the list above
- Use GENERAL_PRACTICE if symptoms are common/general
- Be specific and helpful in treatment recommendations
- Consider urgency based on symptom severity
- Respond ONLY with the JSON object, nothing else`;

        // Get AI response using Gemini Flash 2.5
        const aiResult = await generateContent(prompt, 'gemini-2.5-flash');

        if (!aiResult.success) {
            return NextResponse.json(
                { message: 'Failed to analyze symptoms', error: aiResult.error },
                { status: 500 }
            );
        }

        // Parse JSON response
        let recommendation;
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanedResponse = aiResult.text.trim();
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            recommendation = JSON.parse(cleanedResponse);

            // Validate the response structure
            if (!recommendation.condition || !recommendation.treatment || !recommendation.specialization || !recommendation.urgency) {
                throw new Error('Invalid response structure');
            }

            // Validate specialization
            if (!VALID_SPECIALIZATIONS.includes(recommendation.specialization)) {
                console.warn(`Invalid specialization received: ${recommendation.specialization}, defaulting to GENERAL_PRACTICE`);
                recommendation.specialization = 'GENERAL_PRACTICE';
            }

            // Validate urgency
            if (!['low', 'moderate', 'high'].includes(recommendation.urgency)) {
                recommendation.urgency = 'moderate';
            }

        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('AI Response:', aiResult.text);
            return NextResponse.json(
                { message: 'Failed to parse AI response. Please try again.' },
                { status: 500 }
            );
        }

        // Fetch specialized doctors from database
        let doctors = [];
        try {
            doctors = await prisma.doctorProfile.findMany({
                where: {
                    specialization: recommendation.specialization,
                },
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
                take: 6, // Limit to 6 doctors
            });

            // Fetch ratings for each doctor
            const doctorsWithRatings = await Promise.all(
                doctors.map(async (doctor) => {
                    const reviews = await prisma.review.findMany({
                        where: { doctorId: doctor.user.id },
                        select: { rating: true },
                    });

                    const totalReviews = reviews.length;
                    const averageRating = totalReviews > 0
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                        : 0;

                    return {
                        id: doctor.id,
                        name: doctor.user.name,
                        specialization: doctor.specialization,
                        availableToday: doctor.availableToday,
                        email: doctor.user.email,
                        contactNumber: doctor.user.contactNumber,
                        rating: parseFloat(averageRating.toFixed(1)),
                        reviews: totalReviews,
                    };
                })
            );

            // Sort by rating (highest first) and availability
            doctorsWithRatings.sort((a, b) => {
                if (a.availableToday !== b.availableToday) {
                    return a.availableToday ? -1 : 1;
                }
                return b.rating - a.rating;
            });

            doctors = doctorsWithRatings;

        } catch (dbError) {
            console.error('Database Error:', dbError);
            // Continue without doctors if database fails
            doctors = [];
        }

        // Return successful response
        return NextResponse.json({
            success: true,
            recommendation: {
                condition: recommendation.condition,
                treatment: recommendation.treatment,
                specialization: recommendation.specialization,
                urgency: recommendation.urgency,
            },
            doctors: doctors,
        });

    } catch (error) {
        console.error('AI Assistant API Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
