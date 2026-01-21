import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User, Role } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './email.service';

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

export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Return true even if user not found to prevent enumeration attacks
        return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiration

    // Save hashed token to DB (optional: usually pure token is saved or hashed. 
    // For simplicity here, saving plain token. Production should hash it)
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: tokenExpiry,
        },
    });

    // Send email
    await sendPasswordResetEmail(user.email, resetToken);
    return true;
};

export const resetPassword = async (token: string, newPassword: string) => {
    // Find user with valid token
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        },
    });

    return true;
};
