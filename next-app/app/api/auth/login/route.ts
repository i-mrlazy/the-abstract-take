import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUserCredentials,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown-ip';

  // Check rate limiting
  const rateCheck = checkLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'TooManyRequests',
        message: `Too many failed login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { emailOrUsername, password, keepSignedIn } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'MissingCredentials', message: 'Email/username and password are required.' },
        { status: 400 }
      );
    }

    const authResult = await authenticateUserCredentials(
      emailOrUsername,
      password,
      Boolean(keepSignedIn)
    );

    if (!authResult.success || !authResult.user || !authResult.token) {
      recordFailedLogin(ip);
      return NextResponse.json(
        {
          error: 'InvalidCredentials',
          message: authResult.error || 'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    // Clear rate limit record on successful login
    clearLoginAttempts(ip);

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      token: authResult.token,
    });

    const maxAge = keepSignedIn ? 30 * 24 * 3600 : 24 * 3600;

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: authResult.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'ServerError', message: err.message || 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
