import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const result = await loginUser(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ token: result.token, user: result.user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
