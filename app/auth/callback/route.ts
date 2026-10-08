import { NextResponse } from 'next/server';
import { userClient } from '../../../lib/supabase/server';
import { safeReturn } from '../../../lib/called-it/validation';
export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get('code');
  if (code) { try {
    const client = await userClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeReturn(url.searchParams.get('next')), url.origin));
  } catch { /* redirect to a useful retry state */ } }
  return NextResponse.redirect(new URL('/experiments/called-it?auth=failed', url.origin));
}
