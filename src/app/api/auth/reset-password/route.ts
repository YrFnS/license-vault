import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmNewPassword: z.string()
    .min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { token, newPassword, confirmNewPassword } = result.data;

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token exists
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid reset token', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    // Validate token hasn't expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired', code: 'EXPIRED_TOKEN' },
        { status: 400 }
      );
    }

    // Validate token hasn't been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Reset token has already been used', code: 'USED_TOKEN' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Create audit log entry
    const userWithOrg = await db.user.findUnique({
      where: { id: resetToken.userId },
      include: { organizations: { take: 1 } },
    });

    if (userWithOrg && userWithOrg.organizations.length > 0) {
      const orgId = userWithOrg.organizations[0].orgId;

      await db.auditLog.create({
        data: {
          orgId,
          userId: resetToken.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          entityType: 'User',
          entityId: resetToken.userId,
          entityName: userWithOrg.email,
          details: 'Password reset completed successfully',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
