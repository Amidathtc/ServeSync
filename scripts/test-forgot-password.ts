import { prisma } from '../src/config/prisma';

// Use the singleton instance
// const prisma = new PrismaClient(); // Removed

async function testForgotPassword() {
    const baseUrl = 'http://localhost:3000';
    const email = `reset_test_${Date.now()}@example.com`;
    const password = 'password123';
    const newPassword = 'newPassword456';

    console.log('--- Starting Forgot Password Tests ---');

    // 1. Register User
    console.log('\n1. Registering user...');
    try {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: 'Reset Test User' })
        });
        if (res.status === 201) {
            console.log('✅ Registration successful');
        } else {
            console.error('❌ Registration failed', await res.json());
            return;
        }
    } catch (e) {
        console.error('❌ Registration request failed', e);
        return;
    }

    // 2. Request Password Reset
    console.log('\n2. Requesting password reset...');
    try {
        const res = await fetch(`${baseUrl}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.status === 200) {
            console.log('✅ Forgot password request successful');
        } else {
            console.error('❌ Forgot password request failed', await res.json());
            return;
        }
    } catch (e) {
        console.error('❌ Forgot password request failed', e);
        return;
    }

    // 3. Retrieve Token from DB
    console.log('\n3. Retrieving token from DB...');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordToken) {
        console.error('❌ Token not found in database');
        return;
    }
    const token = user.resetPasswordToken;
    console.log(`✅ Token retrieved: ${token}`);

    // 4. Reset Password
    console.log('\n4. Resetting password...');
    try {
        const res = await fetch(`${baseUrl}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: newPassword })
        });
        if (res.status === 200) {
            console.log('✅ Password reset successful');
        } else {
            console.error('❌ Password reset failed', await res.json());
            return;
        }
    } catch (e) {
        console.error('❌ Password reset request failed', e);
        return;
    }

    // 5. Login with New Password
    console.log('\n5. Logging in with new password...');
    try {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: newPassword })
        });
        if (res.status === 200) {
            console.log('✅ Login with new password successful');
        } else {
            console.error('❌ Login with new password failed', await res.json());
        }
    } catch (e) {
        console.error('❌ Login request failed', e);
    }
}

(async () => {
    await testForgotPassword();
})();
