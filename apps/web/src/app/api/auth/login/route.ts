import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Login failed' }));
      return NextResponse.json({ success: false, error: error.error }, { status: res.status });
    }

    const { data } = await res.json();
    const { token, refreshToken, user } = data;

    await setAuthCookies({ accessToken: token, refreshToken });

    return NextResponse.json({ success: true, data: { user, token } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}