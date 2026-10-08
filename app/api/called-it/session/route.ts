import { NextResponse } from 'next/server';
import { backendConfigured, userClient } from '../../../../lib/supabase/server';
export async function GET() {
  if (!backendConfigured()) return NextResponse.json({ configured: false, profile: null, admin: false });
  try {
    const client = await userClient(); const { data: { user } } = await client.auth.getUser();
    if (!user || user.is_anonymous || !user.identities?.some(i => i.provider === 'x')) return NextResponse.json({ configured: true, profile: null, admin: false });
    const [{ data: profile }, { data: admin }] = await Promise.all([client.from('called_it_profiles').select('*').eq('id', user.id).single(), client.rpc('called_it_is_admin')]);
    return NextResponse.json({ configured: true, profile, admin: admin === true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Your session could not be loaded.' }, { status: 503 }); }
}
