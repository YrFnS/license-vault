import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateTokenSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed', valid: false },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    // Token doesn't exist
    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid reset token',
        code: 'INVALID_TOKEN',
      });
    }

    // Token expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Reset token has expired',
        code: 'EXPIRED_TOKEN',
      });
    }

    // Token already used
    if (resetToken.usedAt) {
      return NextResponse.json({
        valid: false,
        error: 'Reset token has already been used',
        code: 'USED_TOKEN',
      });
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}
