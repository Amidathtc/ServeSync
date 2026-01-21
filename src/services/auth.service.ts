import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User, Role } from '@prisma/client';

export const registerUser = async (email: string, password: string, name: string) => {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: Role.CUSTOMER, // Default role
        },
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    return { user, token };
};

export const loginUser = async (email: string, password: string) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    return { user, token };
};
