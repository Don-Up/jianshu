import { NextResponse } from 'next/server';
import { getAccessToken, clearAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST() {
  try {
    const accessToken = await getAccessToken();

    if (accessToken) {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    await clearAuthCookies();

    return NextResponse.json({ success: true });
  } catch (error) {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}