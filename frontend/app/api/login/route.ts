import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

export async function POST(request: Request) {
  console.log('Login API called');
  try {
    const body = await request.json();
    
    let res;
    try {
      res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      console.error('Error connecting to backend:', fetchErr);
      return NextResponse.json({ error: 'Bad gateway: cannot reach backend' }, { status: 502 });
    }

    const data = await res.json().catch(() => ({}));

    return new NextResponse(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
