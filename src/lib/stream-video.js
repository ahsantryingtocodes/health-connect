// src/lib/stream-video.js
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
const apiSecret = process.env.STREAM_VIDEO_API_SECRET;

export const generateVideoToken = (userId) => {
    if (!apiKey || !apiSecret) {
        throw new Error("Missing Stream API Key or Secret");
    }

    // Initialize the server-side client
    const client = new StreamClient(apiKey, apiSecret);

    // Generate token valid for 1 hour (3600 seconds)
    // We strictly convert userId to string to prevent type errors
    const token = client.generateUserToken({
        user_id: String(userId),
        validity_in_seconds: 3600
    });

    return token;
};

export default generateVideoToken;