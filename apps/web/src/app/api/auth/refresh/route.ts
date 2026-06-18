import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Refresh failed' },
        { status: 401 }
      );
    }

    const { data } = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data;

    await setAuthCookies({ accessToken, refreshToken: newRefreshToken });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}