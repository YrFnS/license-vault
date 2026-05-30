import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCsrfToken } from '@/lib/csrf';

// GET: Returns a new CSRF token for the client to use for subsequent requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const token = generateCsrfToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
