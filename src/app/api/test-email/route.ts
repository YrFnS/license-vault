import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTestEmail } from '@/lib/email';

/**
 * POST /api/test-email
 *
 * Sends a test email to the currently authenticated user.
 * Only works in development mode (NODE_ENV !== 'production').
 */
export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test emails are not available in production mode.' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userName = session.user.name || userEmail || 'User';

    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email address found for your account.' },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(userEmail, { userName });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully. Check the console for dev mode output.',
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      { error: 'Failed to send test email.', details: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
