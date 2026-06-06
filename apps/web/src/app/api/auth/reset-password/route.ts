import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();
    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Email, code, and new password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const result = await resetPassword(email, code, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ token: result.token, user: result.user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
