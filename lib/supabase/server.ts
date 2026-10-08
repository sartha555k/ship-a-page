import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function backendConfigured() { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export async function userClient() {
  if (!backendConfigured()) throw new Error('Called It is not accepting accounts yet.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server components cannot set cookies; proxy refreshes them. */ } } },
  });
}
