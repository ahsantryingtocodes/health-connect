import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the generative model (using Gemini Flash 2.5)
export function getGeminiModel(modelName = 'gemini-2.0-flash-exp') {
    return genAI.getGenerativeModel({ model: modelName });
}

// Generate content from a prompt
export async function generateContent(prompt, modelName = 'gemini-2.0-flash-exp') {
    try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return { success: true, text };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return { success: false, error: error.message };
    }
}

// Generate content with streaming (for real-time responses)
export async function generateContentStream(prompt, modelName = 'gemini-2.0-flash-exp') {
    try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContentStream(prompt);
        return { success: true, stream: result.stream };
    } catch (error) {
        console.error('Gemini API Stream Error:', error);
        return { success: false, error: error.message };
    }
}

// Chat session for multi-turn conversations
export async function startChatSession(history = [], modelName = 'gemini-2.0-flash-exp') {
    try {
        const model = getGeminiModel(modelName);
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });
        return { success: true, chat };
    } catch (error) {
        console.error('Gemini Chat Session Error:', error);
        return { success: false, error: error.message };
    }
}
