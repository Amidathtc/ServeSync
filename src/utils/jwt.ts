import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;
    role: string;
}

export const generateToken = (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign({ userId, role }, secret, {
        expiresIn: '7d', // Token valid for 7 days
    });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        return null;
    }
};
