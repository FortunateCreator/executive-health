import { NextResponse, NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth';

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character';
  return null;
}

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
      const displayName = formData.get('displayName') as string;

      if (!email || !password || !displayName) {
        return new NextResponse('Email, password, and display name required', { status: 400 });
      }
      const passwordErr = validatePasswordStrength(password);
      if (passwordErr) {
        return new NextResponse(passwordErr, { status: 400 });
      }
      if (!formData.get('termsAccepted')) {
        return new NextResponse('You must accept the Terms of Service and Privacy Policy', { status: 400 });
      }

      const result = await registerUser(email, password, displayName);
      if (!result.success) {
        return NextResponse.redirect(new URL('/auth/register?error=' + encodeURIComponent(result.error || 'Registration failed'), baseUrl));
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
    const { email, password, displayName, termsAccepted } = await request.json();
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name required' },
        { status: 400 }
      );
    }
    if (termsAccepted !== true) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy' },
        { status: 400 }
      );
    }
    const passwordErr = validatePasswordStrength(password);
    if (passwordErr) {
      return NextResponse.json(
        { error: passwordErr },
        { status: 400 }
      );
    }
    const result = await registerUser(email, password, displayName);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

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
