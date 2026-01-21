export const sendPasswordResetEmail = async (email: string, token: string) => {
    // In a real application, you would use a library like nodemailer here.
    // For dev purposes, we will log the token to the console.

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    console.log(`
    ======================================
    PASSWORD RESET EMAIL
    To: ${email}
    Your password reset link is: ${resetLink}
    Token: ${token}
    ======================================
  `);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
};
