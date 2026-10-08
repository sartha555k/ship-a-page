import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requiredEnv } from './config';
import { ApiError } from './errors';

let client: SupabaseClient | undefined;

// Admin access is confined to server modules. No browser client or login flow.
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = requiredEnv('SUPABASE_URL');
  try {
    if (new URL(url).protocol !== 'https:') throw new Error();
  } catch {
    throw new ApiError(503, 'INVALID_CONFIGURATION', 'The database is temporarily unavailable.');
  }
  client = createClient(url, requiredEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }) },
  });
  return client;
}
