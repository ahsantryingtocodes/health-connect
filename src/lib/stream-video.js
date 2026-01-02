import jwt from 'jsonwebtoken';

/**
 * Generate a Stream Video JWT token for a user
 * This creates a properly signed JWT token that Stream.io will accept
 */
const generateVideoToken = (userId, expirationInSeconds = 24 * 60 * 60) => {
    const apiSecret = process.env.STREAM_VIDEO_API_SECRET;

    if (!apiSecret) {
        throw new Error('STREAM_VIDEO_API_SECRET is not configured in environment variables');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        user_id: userId,
        iat: now,
        exp: now + expirationInSeconds
    };

    return jwt.sign(payload, apiSecret, { algorithm: 'HS256' });
};

export { generateVideoToken };
export default generateVideoToken;
