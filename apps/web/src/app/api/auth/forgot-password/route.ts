import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    await requestPasswordReset(email);

    // Always return success — don't reveal if email exists
    return NextResponse.json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
