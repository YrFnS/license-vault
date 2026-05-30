import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordReset } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          take: 1,
        },
      },
    });

    // If user exists, generate a reset token and send email
    if (user) {
      // Generate a random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store the token in the database
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Build reset URL
      const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || '';
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      // Send password reset email
      await sendPasswordReset(email, {
        resetUrl,
        userName: user.name || email,
      });

      // Create an audit log entry for the password reset request
      if (user.organizations.length > 0) {
        const orgId = user.organizations[0].orgId;

        await db.auditLog.create({
          data: {
            orgId,
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'User',
            entityId: user.id,
            entityName: user.email,
            details: 'Password reset link requested and email sent',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've sent a reset link.",
      });
    }

    // Always return success even if email doesn't exist (security best practice)
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a reset link.",
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to not leak information
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a reset link.",
    });
  }
}
