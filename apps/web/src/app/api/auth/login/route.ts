import { NextResponse, NextRequest } from 'next/server';
import { loginUser } from '@/lib/auth';

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const baseUrl = getBaseUrl(request);

    // Handle form-encoded submissions (native form POST)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (!email || !password) {
        return new NextResponse('Email and password required', { status: 400 });
      }

      const result = await loginUser(email, password);
      if (!result.success) {
        return NextResponse.redirect(new URL('/auth/login?error=' + encodeURIComponent(result.error || 'Invalid credentials'), baseUrl));
      }

      const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
      response.cookies.set('token', result.token!, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // Handle JSON submissions (fetch API from client)
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    const result = await loginUser(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Also set cookie for JS-based login so non-JS navigation works after
    const response = NextResponse.json({ token: result.token, user: result.user });
    response.cookies.set('token', result.token!, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
